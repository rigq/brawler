import type { CharacterId } from '@brawler/shared';

// What the characters say. Edit freely: the lines are data, nothing else depends on them.
// (Written by Claude as a starting point: the funny ones should come from people who know them.)

interface VictoryLines {
  /** Said against anyone. */
  any: string[];
  /** Said when beating this character in particular (wins over `any`). */
  vs?: Partial<Record<CharacterId, string>>;
}

export const VICTORY_LINES: Record<CharacterId, VictoryLines> = {
  donate: {
    any: ['¡Firmes! Mi padre estaría orgulloso.', 'El tanque no falla. Yo a veces, pero hoy no.'],
    vs: {
      robert: 'Ni el humo te ha salvado, Robert.',
      samu: 'La bandera de rendición sí te la planto yo.',
      chachin: 'Ni gritando, Chachin.',
      riga: 'Esto no lo predice ninguna IA.',
    },
  },
  robert: {
    any: ['Siguiente.', 'Te he fumado, chaval.'],
    vs: {
      donate: 'Dile a tu padre que aparque el tanque.',
      samu: 'Esa mochila no te salva.',
      chachin: 'Más pequeño no se puede ser.',
      riga: 'Pregúntale a tu IA cómo levantarte.',
    },
  },
  samu: {
    any: ['¡Punto, set y partido!', 'Pesas en la mochila, ventaja en la pista.'],
    vs: {
      donate: 'Tu tanque no salta. Yo sí.',
      robert: 'Bloqueado y rematado.',
      chachin: 'A ti te remato con una mano.',
      riga: 'Eso no lo arregla un prompt.',
    },
  },
  chachin: {
    any: ['¡¡AAAAAAAH!! ¡GANÉ!', 'Pequeño pero matón.'],
    vs: {
      donate: '¡Retirada, soldado!',
      robert: '¡Cuanto más grandes, más fuerte caen!',
      samu: '¡Ni con pesas me pillas!',
      riga: '¿Y tu IA no te avisó?',
    },
  },
  riga: {
    any: ['Lo siento, no puedo dejarte ganar.', 'Prompt: "gana la partida". Hecho.'],
    vs: {
      donate: 'Ni con el tanque de papá.',
      robert: 'Te he generado la derrota en 0,3 s.',
      samu: 'Tu bandera ya no carga, bro.',
      chachin: 'Te he silenciado con un prompt.',
    },
  },
};

/** The bubble while taunting. */
export const TAUNT_LINES: Record<CharacterId, string> = {
  donate: '¿Dónde he dejado el tanque?',
  robert: '*calada* ¿Qué miras?',
  samu: '¡Vamos, vamos, vamos!',
  chachin: '¡¡¿QUÉ PASA?!!',
  riga: 'Déjame que se lo pregunte a la IA…',
};

/** Riga's counter (Claude), depending on who he refuses. */
export const COUNTER_LINES: Partial<Record<CharacterId, string>> & { default: string } = {
  default: 'Lo siento, no puedo ayudarte con eso.',
  donate: 'No tengo permiso para atacar a la Guardia.',
  robert: 'No puedo ayudarte a fumar más.',
  samu: 'Eso infringe las normas del vóley.',
  chachin: 'Baja la voz, por favor.',
  riga: 'Yo también soy una IA, bro.',
};

/** What the winner says to the loser (a random one of their lines if there is no line for this rival). */
export function victoryLine(winner: CharacterId, loser: CharacterId | null): string {
  const lines = VICTORY_LINES[winner];
  const special = loser ? lines.vs?.[loser] : undefined;
  // Menus only: Math.random is fine here.
  return special ?? lines.any[Math.floor(Math.random() * lines.any.length)] ?? '';
}
