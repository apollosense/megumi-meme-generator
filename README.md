# Megumi text generator

A small web page for making glowing "Megumi style" text images. Type a line, drag it where you want it on the picture, then save it as a PNG or GIF.

Live site: https://apollosense.github.io/megumi-meme-generator/

## What it does

- Pick a template from a scrollable strip with a search box (Megumi first, then newest to oldest)
- Type your own text, or pick one of the quick phrases
- Drag the text around on the image
- Change size, glow strength, text color and glow color
- Pick a font, or load your own font file
- Use your own background image instead of a template
- Save as PNG, copy the image, or make a GIF with a pulsing glow
- Optional upload to GIPHY with your own API key

Everything runs in your browser. Nothing is uploaded unless you press the GIPHY upload button.

## Files

- `index.html` - the page and its styling
- `app.js` - everything that makes it work (drawing, GIF maker, GIPHY upload)
- `templ/` - the template pictures

To add a template, drop the picture into `templ/` and add a line to the `TEMPLATES` list at the top of `app.js`. That list also says where the text starts and how big it is on each picture.

## Fonts

The Geto page is meant to use CC Wild Words, the font manga bubbles are lettered in. It's a paid font so it is not in this repo. If you have it installed it gets used, otherwise the page falls back to Comic Neue.

No build step and no dependencies. Open `index.html` in a browser, or host the folder on GitHub Pages.

## Running it yourself

Just open `index.html`. It works from a local file or `localhost`.

The page only runs on the domain listed in `ALLOWED_HOSTS` at the top of `index.html`, so if you host it somewhere else you need to edit that list. Google Analytics only loads on the live site, not locally.

## AI use

I used AI (Claude) to help with the parts I didn't know how to do myself. The main ones are:

- the GIF encoder (palette + compression)
- the GIPHY upload code
- the glow / neon text drawing on the canvas
- lining the text up with the speech bubble on the manga pages

I also used it to help split the original single file into `index.html` and `app.js`. I tried to mark the AI-assisted spots with comments in `app.js`.

## Credits

Made by apollosense. All rights reserved, please don't copy or redistribute.
