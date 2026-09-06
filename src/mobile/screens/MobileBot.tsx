// src/mobile/screens/MobileBot.tsx
// Ecra do bot da Betclic na shell mobile. O painel e responsivo, por isso a
// versao mobile reaproveita o mesmo componente que a desktop (BotPanel), tal
// como o resto da app partilha logica entre shells. So estado, so leitura.

import BotPanel from "../../components/BotPanel";

export default function MobileBot() {
  return <BotPanel />;
}
