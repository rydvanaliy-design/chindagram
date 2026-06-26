# Design: Chindamanee Social

Goal: feels like Instagram, wears Chindamanee's colors. Clean, photo-first, easy on a phone.

## Brand (fill these in)
You already built a Chindamanee visual system for the kindergarten orientation deck. Reuse it. Drop the real values in here:
- Primary color: #000080 (the school's main color)
- Accent color: #FFD700
- Logo file: 'logo.png' (place in /public)
- Font: the one from the school deck, or a clean default (Inter, system sans) until you have it.

Until you fill these in, the build can use a neutral palette as a placeholder. The colors are easy to change in one place later (Tailwind config).

## Layout conventions (match Instagram)
- **Mobile-first.** Most students will open it on a phone. Design narrow, let it scale up.
- **Top bar:** logo on the left, a "new post" (+) and profile icon on the right.
- **Feed:** a single vertical column of posts. Each post card: poster's name + small avatar at top, the photo big and edge-to-edge, then like and comment buttons, then the caption, then comments.
- **Bottom nav (mobile):** Home (feed), Search (greyed out until v2), New Post (+), Profile.
- **Profile page:** avatar, name, bio, follower/following counts, then a 3-column grid of that person's photos.
- **Post composer:** pick a photo, see a preview, write a caption, post.

## Tone
- Photo does the talking. Minimal chrome, lots of white space.
- Rounded avatars, soft corners on cards, clear tap targets (students on phones).
- Readable in both English and Thai text in captions and comments (use a font that renders Thai cleanly).

## Admin views (plain, not pretty)
- A simple admin page listing reported posts and comments, each with a "remove" button.
- A simple way to disable an account. Function over polish here.
