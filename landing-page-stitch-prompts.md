# SentriBiD — landing page: Stitch prompts

A public homepage that sells the product, plus matching sign-up and sign-in
screens. Everything here is written to match the app you already have — same
indigo, same Inter, same spacing — so someone who signs up doesn't feel like
they've landed in a different product.

---

## Before you start — two things

**1. The routing needs a small change.** Right now `/` is the Dashboard and it's
behind a login check. The landing page has to live at `/` for logged-out
visitors and the Dashboard moves to `/app` (or `/` stays the Dashboard once
you're signed in and the landing page shows only when you're not). Tell me which
you'd prefer and I'll wire it up — it's a ten-minute change.

**2. Don't ship invented proof.** Stitch will happily generate testimonials with
made-up names and a row of fake customer logos. Those are fine as *placeholders*
while you're designing, but they can't go live — a fabricated quote or a logo
from a company that isn't your customer is a real legal and trust problem. Where
the prompts below ask for testimonials, either put in real quotes with
permission, or delete the section until you have some. Same for any statistic:
verify the number before it goes on the page.

---

## Prompt 0 — design system (paste this first)

```
Design the public marketing website for SentriBiD, a tool that helps small
businesses find and win government contracts. The visitor is a small business
owner — a builder, an IT services firm, a records company — who has never bid on
a federal contract and finds the whole thing intimidating. The site has to feel
credible and calm, not like a startup shouting.

STYLE
- Light. Page background #FFFFFF, alternating sections on #F7F8FA.
- One accent: indigo #4F46E5. Buttons, links, and small highlight marks only.
- Text: #101828 for headings, #344054 for body, #667085 for secondary.
- Borders #E5E7EB. Cards white, 12px radius, very soft shadow.
- Typography: Inter. Hero headline 56px semibold, letter-spacing -0.03em.
  Section headings 36px semibold. Body 17px, line-height 1.6. Small text 14px.
- Generous vertical rhythm: 96px–120px between sections, 24px card padding.
- Icons: thin line icons, 20–24px, grey or indigo. NO EMOJI ANYWHERE.
- No gradients on text, no neon, no glassmorphism, no floating 3D blobs.
- Buttons: primary is solid indigo with white text, 12px radius, 48px tall.
  Secondary is white with a grey border. One primary per section, maximum.
- Everything must work at 390px wide as well as 1440px.

TONE OF THE COPY
Plain, direct, second person. Short sentences. No "leverage", no "empower", no
"revolutionise", no "unlock". Say what the product does. A sentence like "Find
out whether a contract is worth your time before you spend a week on it" is
right. "Supercharge your capture lifecycle" is wrong.
```

---

## Prompt 1 — the landing page

```
Design the SentriBiD homepage. One long scrolling page, in this order.

NAV BAR — sticky, white, 72px tall, 1px bottom border, contents in a 1200px
centred container.
- Left: the wordmark "SentriBiD" in 19px semibold, with "BiD" in indigo.
- Centre: four text links — How it works, Features, Pricing, FAQ.
- Right: a plain text link "Sign in", then a solid indigo button "Start free".
- On mobile the centre links collapse into a hamburger; "Start free" stays.

HERO — white background, 1200px container, two columns on desktop (55/45),
stacked on mobile. 120px of top padding.
Left column:
- A small pill above the headline: light indigo background, indigo text, 13px,
  reading "Built for small businesses, not beltway consultants".
- Headline, 56px: "Win government contracts without a proposal team."
- Sub-headline, 19px in grey, max 520px wide: "SentriBiD finds the contracts you
  can actually win, tells you straight whether to bid, and writes the first
  draft of the proposal."
- Two buttons side by side: solid indigo "Start free" and white outlined
  "See how it works".
- Below them, 14px grey with a small check icon before each, on one line:
  "No card required" · "Set up in 10 minutes" · "Cancel anytime".
Right column:
- A screenshot of the product dashboard in a browser frame with a soft shadow,
  tilted very slightly. The screenshot shows a clean light-grey app with a left
  sidebar, four metric cards across the top reading "Open opportunities 12",
  "Bids in progress 4", "Waiting on your approval 2", "Won this year 3", and
  below them a list of contracts each with a green "85% win chance" badge.

THE PROBLEM — section on #F7F8FA.
Centred heading, 36px: "Most small businesses never bid. Here's why."
Below it, three columns, each a white card with a thin line icon at the top:
1. "You can't find the right ones" — "Tens of thousands of contracts are open at
   any moment. Finding the handful that actually fit your business is a
   full-time job on its own."
2. "You can't tell a real shot from a long shot" — "By the time you work out the
   incumbent was always going to win it, you've spent a week you can't bill."
3. "The proposal is enormous" — "Eighty pages of requirements, due in
   twenty-one days, on top of running your actual business."

HOW IT WORKS — white background.
Centred heading: "Three steps. That's the whole thing."
Three numbered steps laid out horizontally on desktop, stacked on mobile. Each
has a large indigo number (01, 02, 03) in 14px letterspaced caps, a 20px
semibold heading, and two lines of grey body text:
01 "Tell us what you do" — "Your industry codes, your certifications, where you
   work. It takes about two minutes and it's the only setup there is."
02 "We bring you the work" — "Live search across every open federal contract,
   plus matches picked out for your profile and scored on how likely you are to
   win them."
03 "Decide, then bid" — "Upload the solicitation. We pull out every requirement,
   flag what could sink you, work out the price, and draft the proposal."

FEATURES — three alternating rows, each with text on one side and a product
screenshot on the other. White background, generous spacing between rows.

Row 1 (image right): small indigo caps label "BEFORE YOU COMMIT". Heading:
"Know your odds before you spend the week." Body: "Every opportunity gets a win
chance and a plain-English reason for it. We tell you what would sink the bid —
a certification you don't hold, a timeline you can't meet — and what to do about
each one." Bulleted list of three items with small check icons: "Win chance
scored against your profile", "Risks flagged with a fix for each", "A straight
bid or no-bid recommendation". Screenshot: a card reading "Is this a fit?" with a
large green 85%, and beneath it a "Watch out for" panel listing two risks.

Row 2 (image left): label "NOTHING MISSED". Heading: "Every requirement, pulled
out and sorted." Body: "We read the whole solicitation and separate what's
mandatory from what's merely nice to have, with the section it came from so you
can check our work." Screenshot: a list of requirements grouped under "Must
have" and "Technical", each with a section reference like "Section L.3.2".

Row 3 (image right): label "PRICE WITH CONFIDENCE". Heading: "Three prices, and
what each one does to your odds." Body: "Put in your costs once. We work out a
lower-risk price, a balanced one and a higher-margin one, and show you the win
chance for each so you're choosing, not guessing." Screenshot: three pricing
cards labelled "Lower risk", "Balanced", "Higher margin" with prices and
margins.

MORE FEATURES — section on #F7F8FA. Heading: "And the rest of it."
A 3x2 grid of six small white cards, each with a line icon, a 17px semibold
title and two lines of grey text:
- "One pipeline" — "Everything you're tracking, from first look to won or lost."
- "Teaming partners" — "See who just won a prime contract in your industry, and
  get a drafted intro email."
- "Proposal drafts" — "A first draft in Word or PDF, built from the solicitation
  and your company profile."
- "Deadline tracking" — "What's closing this week, on the screen you open first."
- "Compliance checks" — "Every requirement checked against what your company can
  actually prove."
- "Ask questions" — "Stuck on a bid? Ask, and get an answer that knows your
  numbers."

PRICING — white background. Heading: "Simple pricing." Sub: "Start free. Move up
when you win something."
Three cards side by side, the middle one raised with an indigo border and a
small "Most popular" pill. Each card: plan name, large price, a line of grey
text about who it's for, a divider, five feature lines with check icons, and a
full-width button at the bottom.
Use placeholder plan names Starter / Professional / Team, and placeholder prices
$0, $49/month, $149/month — these are stand-ins to be replaced.

FAQ — section on #F7F8FA. Heading: "Questions people actually ask."
Six expandable rows, single column, max 760px wide, each with a chevron on the
right:
- "Do I need to be registered on SAM.gov first?"
- "I've never bid on a government contract. Is this too advanced for me?"
- "Does it write the whole proposal, or just part of it?"
- "Who can see my company information?"
- "What happens to my data if I cancel?"
- "How accurate is the win chance?"
Write a two-to-three sentence honest answer under each.

FINAL CTA — white background, centred, 120px of padding.
Heading, 40px: "There's work out there with your name on it."
Sub in grey: "Set up your profile and see what you match with. It takes ten
minutes and costs nothing."
One solid indigo button, "Start free", plus a 14px grey line under it: "No card
required."

FOOTER — #F7F8FA, 1px top border. Four columns: the wordmark with a one-line
description under it; Product (How it works, Features, Pricing); Company (About,
Contact); Legal (Privacy, Terms). A bottom bar with "© 2026 SentriBiD" on the
left.
```

---

## Prompt 2 — sign up

```
Design the SentriBiD sign-up page, matching the marketing site exactly.

Two-column full-height layout, no nav bar.

LEFT (56% width, hidden below 1024px) — white, 48px padding, three things
stacked with space between:
- Top: the "SentriBiD" wordmark.
- Middle: a 36px semibold heading "Government contracts, without the guesswork."
  Below it, three rows, each with a small indigo-tinted rounded square holding a
  line icon, then a 17px semibold title and a line of grey text:
  · "Find the work" — "Search every open federal contract, or let us match them
    to your business."
  · "Know what's worth bidding" — "A straight answer on your odds before you
    spend a week on it."
  · "Get the proposal written" — "Requirements pulled out, pricing built, first
    draft ready to edit."
- Bottom: 13px grey "© 2026 SentriBiD".

RIGHT — centred form, max 400px wide.
- Heading 24px semibold: "Create your account".
- Grey sub-line: "Two minutes to set up. No card needed."
- Four stacked fields, each with a 13px grey label above a 40px-tall input with
  a 1px border and 8px radius: Your name, Company name, Work email, Password.
- Under the password field, 13px grey helper text: "At least 8 characters."
- A full-width solid indigo button, 44px tall: "Create account".
- Below it, 14px centred: "Already have an account? Sign in" with "Sign in" as
  an indigo link.
- At the very bottom, 13px grey centred: "By creating an account you agree to
  our Terms and Privacy Policy", with both as underlined links.

No social sign-in buttons.
```

---

## Prompt 3 — sign in

```
Same two-column layout and left panel as the sign-up page.

RIGHT — centred form, max 400px wide.
- Heading: "Sign in". Grey sub-line: "Pick up where you left off."
- Two fields: "Username or email", and "Password" with a small eye icon inside
  the right edge of the input to reveal it.
- A right-aligned 13px indigo link under the password field: "Forgot your
  password?"
- Full-width solid indigo button: "Sign in".
- Below: "New here? Create an account", with the second half as an indigo link.
```

---

## Part 4 — refinement prompts

Paste one at a time rather than regenerating a whole screen:

- `Remove all emoji and replace them with thin line icons.`
- `Reduce to one accent colour — indigo #4F46E5. Everything else white, grey or near-black.`
- `Increase the space between sections to 120px and make the body text 17px with 1.6 line height.`
- `The headline is too clever. Rewrite it to say plainly what the product does.`
- `Remove the customer logo strip.`
- `Make the hero screenshot a real-looking product UI, not an abstract illustration.`
- `Show me the 390px mobile version of this page.`
- `Make the nav bar sticky and add a subtle bottom border that only appears once the page is scrolled.`
- `Cut this section's copy by half. Keep the specifics, drop the adjectives.`

---

## Part 5 — when the code comes back

Send it the same way you sent the last batch — drop it in a folder and give me
the path. I'll convert it to React against the design tokens already in
`tailwind.config.js`, so the landing page and the app share one system rather
than drifting apart. I'll also wire the routing so `/` shows the landing page
when you're logged out and the Dashboard when you're logged in.

Two things I'll need from you before it goes live:

- **Real pricing.** The three tiers above are placeholders.
- **Real proof, or none.** Whatever testimonials and numbers Stitch generates
  need replacing with things you can stand behind, or removing.
