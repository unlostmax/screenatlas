#!/usr/bin/env python3
"""Assemble Second Sole from preserved supplied and Image Gen reference PNGs.

No image generation or image editing occurs here. Existing reference bytes and
hashes are retained. Run from the checkout: python3 -m tools.build_marketplace_example
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

from atlas.png import inspect_png
from atlas.project import Project, contract

ROOT = Path(__file__).resolve().parents[1] / 'atlas/examples/second-sole'

# All coordinates belong to one canvas. These frames are visibility groups,
# never separate pages. Each primary tab is the root of its own downward tree.
# Shared destinations keep one screen identity and connect across trees.
GROUPS = [
    ('home', 'Home', 80, 80, 560, 2300),
    ('search', 'Search', 780, 80, 560, 1150),
    ('sell', 'Sell', 1480, 80, 560, 1750),
    ('inbox', 'Inbox', 2180, 80, 560, 1750),
    ('profile', 'Profile', 2880, 80, 560, 2350),
    ('direction', 'Visual direction', 780, 1450, 560, 450),
]
LAYOUT = {
    'home': ('home', 170, 90, 220),
    'listing': ('home', 160, 650, 240),
    'checkout': ('home', 160, 1230, 240),
    'order-confirmed': ('home', 170, 1810, 220),
    'search': ('search', 170, 90, 220),
    'filters': ('search', 170, 650, 220),
    'sell': ('sell', 170, 90, 220),
    'photos': ('sell', 40, 650, 220),
    'listing-review': ('sell', 300, 650, 220),
    'listing-created': ('sell', 300, 1230, 220),
    'inbox': ('inbox', 170, 90, 220),
    'conversation': ('inbox', 170, 650, 220),
    'offer': ('inbox', 170, 1230, 220),
    'profile': ('profile', 170, 90, 220),
    'my-listings': ('profile', 40, 650, 220),
    'saved': ('profile', 300, 650, 220),
    'listing-actions': ('profile', 40, 1230, 220),
    'purchase': ('profile', 300, 1230, 220),
    'edit-listing': ('profile', 40, 1810, 220),
    'moodboard': ('direction', 40, 90, 480),
}
PURPOSE = {
    'profile': 'Manage your seller profile, listings, purchases, and saved pairs.',
    'my-listings': 'See listing performance and manage active, sold, draft, and archived pairs.',
    'listing-actions': 'Choose an action for one owned listing without losing the list context.',
    'edit-listing': 'Edit a listing while preserving its identity, photos, and current saved version.',
    'home': 'Discover pre-owned sneakers and start a purchase, search, or sale.',
    'search': 'Find a brand or model and narrow the available listings.',
    'filters': 'Refine search by brand, size, condition, and price in AUD.',
    'listing': 'Inspect one pair, check its condition and price, and buy or make an offer.',
    'saved': 'Return to saved pairs and open the same shared listing detail.',
    'sell': 'Describe a pair, attach photos, and save a draft before publishing.',
    'photos': 'Add and review listing photos in a three-column grid.',
    'listing-review': 'Review the item, delivery terms, and description before publishing.',
    'listing-created': 'Confirm that publishing succeeded and open the new listing.',
    'inbox': 'Read buyer and seller conversations linked to their sneaker listings.',
    'conversation': 'Discuss a specific pair and keep messages attached to that listing.',
    'offer': 'Send a proposed price and an optional message for the selected pair.',
    'checkout': 'Review the item, delivery, payment method, and total before placing an order.',
    'order-confirmed': 'Confirm one successful order and provide a route to its status.',
    'purchase': 'Track the purchased pair and contact its seller.',
    'moodboard': 'Preserve the supplied multi-screen design direction alongside its individual derivatives.',
}
# label, destination, effect. Effects describe the app-to-be, never perform actions.
ACTIONS = {
    'profile': [('My listings','my-listings',''),('Purchases','purchase',''),('Saved','saved',''),('Home','home',''),('Sell a pair','sell',''),('Messages','inbox','')],
    'my-listings': [('More actions','listing-actions','Choose the exact listing row.'),('Add listing','sell','Start a new draft.'),('Open listing','listing',''),('Back to profile','profile','')],
    'listing-actions': [('Edit listing','edit-listing',''),('Duplicate listing','sell','Start a new draft; never copy the original listing ID.'),('Pause listing','my-listings','Pause only the chosen active listing.'),('Archive listing','my-listings','Archive the chosen listing; preserve history.'),('Share listing',None,'Open the platform share surface for the selected listing.'),('Delete listing','my-listings','Ask for confirmation; cancel leaves the listing unchanged.'),('Dismiss','my-listings','No changes.')],
    'edit-listing': [('Save changes','my-listings','Validate and save this listing.'),('Cancel','my-listings','Ask before discarding unsaved changes.')],
    'home': [('Open a pair','listing',''),('Search','search',''),('Sell a pair','sell',''),('Inbox','inbox',''),('Profile','profile','')],
    'search': [('Open result','listing',''),('Filters','filters',''),('Home','home','')],
    'filters': [('Apply filters','search','Preserve the query and show matching results.'),('Reset',None,'Reset draft filters without submitting.'),('Close','search','Keep previously applied filters.')],
    'listing': [('Buy now','checkout','Check current availability.'),('Make offer','offer',''),('Save pair','saved','Toggle the bookmark without placing an order.'),('Back','home','')],
    'saved': [('Open saved pair','listing',''),('Back to profile','profile','')],
    'sell': [('Add photos','photos',''),('Continue','listing-review','Validate required fields.'),('Save draft','my-listings','Keep an unpublished draft.'),('Cancel','my-listings','Ask before discarding changes.')],
    'photos': [('Done','sell','Keep the selected photos in this draft.'),('Cancel','sell','Do not discard previously saved photos.')],
    'listing-review': [('Publish listing','listing-created','Publish once after successful validation.'),('Edit details','sell','Preserve the draft and its photos.')],
    'listing-created': [('View listing','listing','Open the newly created listing ID.'),('Create another','sell','Start a separate draft.')],
    'inbox': [('Open conversation','conversation',''),('Profile','profile','')],
    'conversation': [('Make offer','offer',''),('View pair','listing',''),('Back to inbox','inbox','')],
    'offer': [('Send offer','conversation','Send one price proposal; do not create an order.'),('Close','listing','Do not send the draft offer.')],
    'checkout': [('Place order','order-confirmed','Use an idempotent purchase request; never charge twice.'),('Back','listing','Do not place an order.')],
    'order-confirmed': [('View order','purchase',''),('Keep browsing','home','')],
    'purchase': [('Message seller','conversation',''),('Back to purchases','profile','')],
    'moodboard': [],
}
EDGE_CASES = {
    'my-listings': 'Keep filter selection on return. Sold and archived rows must not offer active-only operations.',
    'listing-actions': 'Recheck ownership and listing status. Canceling deletion leaves the listing unchanged. A stale row requires refresh.',
    'edit-listing': 'A save failure retains the draft; concurrent edits require reconciliation, not silent overwrite.',
    'sell': 'Missing photos or required fields block continuation. Save failure retains all entered data.',
    'photos': 'Maximum ten photos. Handle denied photo access and upload failures without clearing earlier selections.',
    'filters': 'No matches and load failure are different states. Reject an inverted price range.',
    'listing': 'A sold or removed pair cannot proceed to checkout; explain availability changes.',
    'offer': 'Validate a positive AUD amount. A failed send keeps the draft and retry does not duplicate the offer.',
    'checkout': 'Revalidate stock, price, shipping, and total. Payment failure must not show success or double-charge on retry.',
    'order-confirmed': 'Show success only for the returned order ID, not an optimistic local state.',
    'purchase': 'Unavailable tracking and a delayed shipment are distinct. Preserve the order ID on every retry.',
}


def main():
    manifest = json.loads((ROOT/'references.json').read_text())
    nodes = []
    for item in sorted(manifest, key=lambda item: list(LAYOUT).index(item["id"])):
        file = ROOT/item['path']
        raw = file.read_bytes()
        assert hashlib.sha256(raw).hexdigest() == item['sha256']
        size = inspect_png(raw)
        group, x, y, width = LAYOUT[item['id']]
        height = round(width * size['height']/size['width'])
        c = contract()
        c.update(purpose=PURPOSE[item['id']],
                 entry='Arrive through a mapped action with the relevant listing, conversation, or order identity.',
                 data='Illustrative sneaker marketplace data in AUD. Keep item identity, size, condition, price, and imagery consistent.',
                 states='The reference shows the named state only. Specify loading, empty, error, and disabled states separately during implementation.',
                 edgeCases=EDGE_CASES.get(item['id'], 'Preserve context on Back. Distinguish unavailable data from an empty state and provide a retry.'),
                 accessibility='Provide readable contrast, accessible labels and touch targets, text scaling, keyboard access, and reduced motion. Do not rely on color alone.',
                 acceptance='Exercise each mapped action in the implementation. Capture this exact state and compare with the reference; a static image does not establish working behavior.',
                 sources=['product','visual','provenance'])
        c['actions'] = [{'id':f'action-{i+1}', 'label':label, 'to':to, 'kind':'return' if label.startswith(('Back','Cancel','Close','Dismiss')) else 'navigation', 'condition':'Only when the selected item is available and the user has permission.', 'effect':effect} for i,(label,to,effect) in enumerate(ACTIONS[item['id']])]
        if item['id']=='moodboard':
            c.update(entry='Original user-supplied design board.', data='Five primary navigation screens and six supporting states.', states='Visual direction only; no simulated interactions.', edgeCases='Individual derivatives may differ slightly from the source board.')
        nodes.append({'id':item['id'],'title':('Sell' if item['id']=='sell' else item['title']),'group':group,'kind':'anchor' if item['id']=='moodboard' else 'screen','platform':'iOS concept','x':x,'y':y,'w':width,'h':height,
                      'reference':{'sha256':item['sha256'],'path':item['path'],'provenance':item['provenance']},'contract':c})
    data = {'schemaVersion':1,'id':'1bfacb73-31cd-4a2b-8377-617360e96737','name':'Second Sole','revision':1,
            'description':'A sneaker resale app mapped from supplied references and expanded with generated design states.',
            'platforms':['iOS concept'],
            'groups':[dict(id=id,title=title,note='',x=x,y=y,w=w,h=h) for id,title,x,y,w,h in GROUPS],
            'nodes':nodes,
            'edges':[{'id':f'direction-{to}','from':'moodboard','to':to,'label':'Visual reference','kind':'reference'} for to in ('home','profile','sell','inbox')],
            'documents':[
                {'id':'product','title':'Product brief','body':'Second Sole is an illustrative peer-to-peer sneaker resale app. Buyers discover, save, negotiate and purchase pairs. Sellers create and manage listings. Conversations and orders retain stable listing identity. The map describes intended behavior; no commerce backend, payment processing, real seller data, or working sneaker app is bundled.'},
                {'id':'visual','title':'Visual direction','body':'Preserve the supplied warm ivory, black typography, photographic sneakers, pale grey surfaces, and orange primary actions. Five main destinations: Home, Search, Sell, Inbox, Profile. Keep ScreenAtlas chrome separate from the app design. Original board and full-size supplied screens remain under sources/.'},
                {'id':'provenance','title':'Reference provenance','body':'Three original supplied PNGs are retained byte for byte: the mood board, My listings, and its action sheet. Eleven standalone screen derivatives were reconstructed with the built-in Image Gen tool from the mood board; these are not exact pixel crops. Six further states extend the same app. Exact prompts and input/output digests are in prompts.json and references.json. None of these images is a real app capture or a recorded reviewer approval.'},
            ]}
    project = Project(ROOT)
    project.write(data)
    result = project.check()
    if result['warnings']:
        raise SystemExit(json.dumps(result,indent=2))
    (ROOT/'REFERENCES.md').write_text('# Second Sole references\n\nOriginals are under `sources/`. Generated derivatives and extensions preserve their exact prompts and input digests in `prompts.json`.\n\n'+ '\n'.join(f"- [{item['title']}]({item['path']}) — {item['provenance']['method']}" for item in manifest)+'\n')
    print(json.dumps(result,indent=2))


if __name__=='__main__':
    main()
