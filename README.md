# Starpath

Starpath is a browser-based visualization of planetary positions on a linear zodiac axis.
The Sun is fixed at the midpoint, and all other bodies are plotted by relative longitude.

## Features

- Live linear zodiac view with Sun anchored at center
- Moon + Mercury through Neptune rendered in real time
- Tropical, geocentric, true ecliptic-of-date longitudes
- Ephemeris powered by `astronomy-engine`
- Time navigation controls: year, month, week, day, and `Now`

## Tech Stack

- Vanilla HTML/CSS/JavaScript
- [astronomy-engine](https://github.com/cosinekitty/astronomy)

## Getting Started

```bash
cd /Users/mz/Dev/starpath
npm install
python3 -m http.server 4173
```

Open [http://localhost:4173](http://localhost:4173).

## Controls

- Use `-1 Year | -1 Month | -1 Week | -1 Day` to move backward in time
- Use `Now` to jump back to current UTC time
- Use `+1 Day | +1 Week | +1 Month | +1 Year` to move forward in time

## Coordinate Model

- Zodiac mode: tropical
- Frame: geocentric
- Coordinates: true ecliptic-of-date
- Planet vectors: geocentric with aberration enabled

## Project Structure

- `/Users/mz/Dev/starpath/index.html` UI shell
- `/Users/mz/Dev/starpath/styles.css` layout and visual design
- `/Users/mz/Dev/starpath/main.js` ephemeris integration and rendering logic

## Roadmap

- Optional sidereal mode
- Optional selectable bodies (add/remove Pluto, nodes, asteroids)
- Optional precision/debug panel for raw longitude inspection

## License

No license file is included yet. If you plan to open source this, add a `LICENSE` file (MIT is a common choice).
