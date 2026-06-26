# Product Spec: Chindamanee Social

## What this is
A private, Instagram-style social platform for Chindamanee School. Photo posts, a feed, profiles, and the social actions people expect. Closed to the school: only approved school accounts can join. Not public, not indexable by search engines.

## Who's on it
- **Students** (the main users): post, browse, like, comment, follow.
- **Teachers / staff**: same as students, plus they can be given admin rights.
- **Parents**: browse and follow. Posting can be limited or off for parent accounts (decide later).
- **Admins** (a few trusted staff): can remove any post, disable any account, and see reports.

## Feature scope (staged)

### v1 — the first build
- Accounts: sign up + log in (email + password).
- Post a photo with a caption.
- Feed: see posts from people you follow, newest first.
- Like a post.
- Comment on a post.
- Follow / unfollow people.
- Profile pages: a user's photo, bio, and grid of their posts.
- Admin + safety: remove a post, disable an account, basic roles (user vs admin).

### v2 — next layer
- Search / explore (find people and posts).
- Notifications (someone liked, commented, or followed you).

### v3 — later
- Direct messages.
- Stories.

## Safety and privacy rules (apply from v1)
- Closed platform: registration is limited to approved school accounts. No open public sign-up.
- Every post and comment can be removed by an admin.
- Any account can be disabled by an admin.
- A "report" button on posts and comments (the queue can be simple at first: it flags the item for admins).
- No public visibility: a logged-out visitor sees only a login screen, never student content.
- Direct messages (v3) are deferred on purpose. With minors on the platform, DMs need moderation and controls in place first.

## Core behaviors to get right in v1
- A user only sees the app after logging in.
- Uploading a photo creates a post that appears in the feed and on the user's profile.
- Likes and comments update live or on refresh, attached to the right post.
- Following someone changes what shows in your feed.
- An admin can remove a post and it disappears for everyone.
