# Start a ScreenAtlas project with the user

Read SKILL.md in this directory for commands, identity, and review rules.
Use the project, launcher, and local viewer URL supplied by the handoff.
Begin the conversation in the current agent session. Browser buttons are an
optional way to recover this handoff, never a required onboarding step.
Keep the viewer running in a background terminal/session. Open it with an
available browser tool once inspiration is imported so the user can review it.
If browser tools are unavailable, give the local URL to the user.

1. Read the existing project and the workflow before making changes. Preserve
   existing screens, references, and review history; continue the current project
   rather than replacing it. Reuse details and an approved visual direction
   already supplied by me. Read relevant README/product notes in the user's app
   repository if one is available. ScreenAtlas's own checkout describes the tool,
   not the app the user wants to build. Skip completed stages and resume at the
   earliest missing decision. Ask only what is missing.
2. Keep discovery quick. If the app is not already clear, start with one question:
   "What are we building?" Use the answer and existing project context to establish
   its main task and platform. Ask a brief follow-up only if necessary. Wait for
   answers to any questions before continuing. Do not
   generate images, create a screen inventory, or implement the app yet.
3. Then ask me to attach two or three inspiration images I like, from the web
   or my own collection, and optionally say what I like about them. These can
   be photographs, objects, interiors, artwork, or existing interfaces. Wait
   for my attachments. Do not search for replacements or generate images while
   waiting. If I explicitly choose to skip references, ask for a short visual
   description instead. Clarify a reference you cannot access rather than
   pretending to have seen it.
4. Create or reuse a dedicated Inspiration group (stable ID inspiration) before
   importing visuals. Save each supplied reference as its own kind=anchor node,
   with an empty actions array and a purpose identifying it as user-supplied
   inspiration. Import its PNG as a proposal with the actual source and origin
   recorded; do not invent a generation prompt for supplied artwork. Preserve
   original files in the project as well. If a display PNG conversion is needed,
   record that conversion and the original input digest. User-supplied references
   are inputs, not generated mood images or approved app screens.
   Use these supplied images as visual inputs to the available image tool to
   generate two or three separate mood images that express this project's
   atmosphere, palette, lighting, materials, and texture. These are visual
   foundations, not app screens. By default include no UI components, interface
   mockups, typography, letters, logos, or text, even if the inspiration contains
   them. Include UI or typography only if I explicitly ask. Extract the visual
   qualities of the references rather than copying their brands or text.
   If the tool cannot use reference images, explain that limitation first.
5. Show me the mood images and ask which direction to keep or refine. Stop for
   my design review before generating any app screens. A request to revise is
   not acceptance. Retain the original inputs, generated PNGs, exact prompts,
   input/output digests, and actual tool provenance. Add the mood images as
   proposals on separate kind=sheet nodes in the same Inspiration group so I can
   review them in ScreenAtlas. These boards have no app navigation actions.
   Keep the supplied references and generated mood images separately titled and
   laid out in two rows. These boards stay outside the app navigation trees.
   Record my chosen direction and its exact image identities in a supporting
   visual-direction document. I accept candidates and promote references
   explicitly; do not do either on my behalf without that authorization.
6. After I approve the visual direction, create a screen inventory and behavior
   contracts for MY app. Use its actual
   navigation sections as groups; do not copy the demo's tab names or force five
   groups. Put each main screen at the top of its group and supporting states
   below it. Size cards to the image ratio and platform, including landscape
   desktop screens. Reuse shared destinations and connect actions to stable screen IDs.
   Use project-set or add-screen with the current expected project digest.
7. Start with one main screen and one useful supporting state. Use the approved
   mood images as visual inputs and the recorded direction as the foundation
   for every app screen, including later additions and revisions. Keep colors,
   atmosphere, materials, and visual treatment consistent while making the UI
   usable. Link each screen contract to the visual-direction document and retain
   the actual reference image digests in generation provenance. Use the image
   generation tool available in this Codex session to create separate PNG design
   references, retaining the exact prompt and actual provenance. If image
   generation is unavailable, tell me and let me supply PNGs. Do not silently
   switch to a paid API or claim that a generated design is a real app screenshot.
8. For both mood boards and app screens, import images as proposals using
   import-proposals and stable operation
   UUIDs. Create the screen records first. Keep any existing reference as the
   baseline. Use context SCREEN_ID to read the correct reference identity.
9. Show me the app screens in ScreenAtlas and stop for my design review. I accept
   exact candidates and promote them to references explicitly. Do not accept,
   promote, or approve screenshots on my behalf without that authorization.
10. After review, expand the map. Implement the app when I ask, using the approved
   references and behavior contracts. Capture real screenshots from the running
   implementation separately and import them with import-captures for comparison.

At every image-generation stage, use only the tool actually available in this
session. If unavailable, explain that and let me supply PNGs. Never silently
switch to a paid API or present a generated image as a real app capture.

Keep the existing viewer running; refresh it after imports. Do not publish,
deploy, or change my global Codex configuration as part of this setup.
