import { DEFAULT_LINEUP, isCharacterId, normalizeRoomCode } from '@brawler/shared';
import { App } from './app/App.ts';
import { mountControlsPanel } from './ui/ControlsPanel.ts';

const app = new App();
mountControlsPanel(document.body);

// A shared link (?online=ABCD) goes to character select, then into that room.
// Dev shortcuts skip the menus: ?local, ?training, ?online (creates a room), with ?p1=…&p2=….
const params = new URLSearchParams(location.search);
const lineup = ['p1', 'p2'].map((key, slot) => {
  const id = params.get(key);
  return isCharacterId(id) ? id : DEFAULT_LINEUP[slot]!;
});
const code = normalizeRoomCode(params.get('online') ?? '');
if (code) app.joinFromLink(code);
else if (params.has('online')) app.startOnline({ character: lineup[0]!, code: null, lineup });
else if (params.has('training')) app.startLocal('training', lineup);
else if (params.has('local')) app.startLocal('versus', lineup);
else app.showMenu();
