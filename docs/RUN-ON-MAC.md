# Running Chindagram on your Mac — full guide

Written for a beginner. Follow it top to bottom the first time. After that, you only need the short "Every time after" section.

## Words you'll see
- **Terminal**: a built-in Mac app where you type commands instead of clicking.
- **Command**: a line of text you type, then press `Return` to run.
- **localhost:3000**: the private web address of the app while it runs on your computer. Only you can see it.

---

## One-time setup (first run)

### 1. Open Terminal
Press `Cmd` + `Space`, type `Terminal`, press `Return`. A window with text appears.

### 2. Go into the project folder
Type `cd` and a space (don't press Return yet):
```
cd 
```
Then drag the **chindagram** folder (in `Desktop` → `Claude instagram`) onto the Terminal window. It fills in the location. Press `Return`.

(Dragging is the reliable way — it fills in the exact location, whatever the
folder is called and wherever it lives.)

### 3. Install the app's parts (takes a few minutes)
```
npm install
```
Wait until the cursor comes back on an empty line. Yellow "warn" lines are fine; red "error" lines are not.

### 4. Build the database
```
npx prisma migrate dev --name init
```
Wait for `Your database is now in sync with your schema`.

### 5. Turn the app on
```
npm run dev
```
This keeps running and does **not** give the cursor back. That's correct. Leave the window open.

### 6. Open it
In your browser, go to `localhost:3000`. You'll see the login screen. Click **Create an account** and sign up. **The first account you make is the admin.**

Done. The app is running.

---

## Every time after (the short version)
1. Open Terminal.
2. Go into the folder (step 2 above).
3. Turn it on:
   ```
   npm run dev
   ```
4. Open `localhost:3000`.

That's it — no install or database step needed again.

---

## Turning it off
Click the Terminal window running the app and press `Control` + `C`. The app stops and the cursor returns. Closing the Terminal window also stops it.

## Starting completely fresh (wipe all accounts and posts)
With the app stopped:
```
rm -f prisma/dev.db
npx prisma migrate dev --name reset
npm run dev
```
This gives you an empty app again, and the first new account becomes admin.

---

## If something goes wrong

**"command not found: npm" (or node)**
Node.js isn't installed or the Terminal can't find it. Install Node from nodejs.org (the "LTS" version), close and reopen Terminal, try again.

**"too many redirects" in the browser**
An old login cookie. Open a **private window** (`Cmd` + `Shift` + `N`) and go to `localhost:3000`, or clear cookies for localhost.

**Error mentioning a missing module or "@prisma/client"**
Run `npm install` once, then redo the database step (`npx prisma migrate dev`).

**"Port 3000 is already in use"**
The app is already running in another Terminal window. Either use that one, or stop it there with `Control` + `C`.

**The page won't load at all**
Make sure the Terminal running `npm run dev` is still open and shows a line like `Local: http://localhost:3000`. If you closed it, run `npm run dev` again.

**Anything else**
Copy the red error text and ask for help — that text usually says exactly what's wrong.
