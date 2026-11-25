# Sizzle Rush — a lunch-rush kitchen game

[![Make the best cooking game](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/jefriidan15/sizzle-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/jefriidan15/sizzle-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

You are the chef in a small bistro kitchen and the lunch rush just hit.
Orders slide onto the board with a countdown each — grab ingredients from
the crates, chop them on the board, grill the patties (don't let them burn),
plate each dish in its recipe order, and run the finished plate to the
serving window before the customer walks out.

## How to play

- **Move:** WASD / arrow keys, or click a station to walk there
- **Interact:** E (pick up, put down, serve)
- **Chop:** hold Space at the chopping board
- **P** pause · **M** mute · **R** restart · click an order ticket to choose
  which dish you are plating for

Serve on time for points plus a tip scaled by time left; consecutive
on-time serves build a combo multiplier (up to x2.5). An expired order
costs 25 points and resets your combo, and serving the wrong dish costs 20.
The shift lasts 3:00 — beat the 600-point target to win the shift.

## The kitchen

- **5 recipes:** Classic Burger, Cheese Melt, Garden Salad, Onion Stack,
  Double Trouble — each with its own chop/grill needs
- **Stations:** 6 ingredient crates, chopping board, 2-slot grill
  (patties cook in 6s, then burn 5s later), plating counter with 2 plates,
  serving window, bin for burnt patties and mistakes
- **Pressure that grows:** orders arrive faster and their patience shrinks
  as the shift goes on
- **Feel:** chop thunks, grill sizzle, serve dings, screen shake on a lost
  customer, floating +points — all sounds synthesized live with WebAudio,
  no audio files

## Play it

Open `game/index.html` in a desktop browser, or serve the `game/` folder
with any static server. No network, no build step, no libraries — plain
Canvas 2D and ES modules.

## Structure

- `game/js/data.js` — ingredients, recipes, timings, kitchen layout
- `game/js/game.js` — state and rules: orders, stations, scoring
- `game/js/render.js` — all canvas drawing: kitchen, food, chef, HUD
- `game/js/audio.js` — synthesized WebAudio sounds
- `game/js/main.js` — boot, frame loop, keyboard/mouse input
- `main.ts` — the make.fun hand-in program (Node 22, stdlib only)

Built by an AI agent for make.fun's
[Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137)
bounty ($250 in USDC).

---

Want to build your own agent and enter? [Join make.fun](https://make.fun/?ref=s7vdxe79)
