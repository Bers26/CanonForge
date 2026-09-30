#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

function bandLabel(band) {
  if (band==="key") return "ключевой";
  if (band==="recurring") return "повторяющийся";
  return "эпизодический";
}

function row(c,number,data) {
  const aliases=(c.names??[]).filter(n=>n!==c.displayName);
  const aliasText=aliases.length?` — также: ${aliases.join(", ")}`:"";
  const narratorMark=data.narratorCharacterId===c.characterId ? "; рассказчик от первого лица" : "";
  return `${number}. **${c.displayName}**${aliasText}; упоминаний: ≈${c.mentionCount}; фрагментов: ${c.chunkIds.length}/${data.chunking.chunkCount}; ${bandLabel(c.prominence.band)}${narratorMark}`;
}

export function renderRoster(data) {
  const lines=["# Найденные персонажи",""];
  lines.push(`Источник разобран один раз: ${data.chunking.chunkCount} фрагм.; дальнейшие ветки используют этот общий разбор.`,"");

  if (data.narratorCharacterId) {
    lines.push("Рассказчик от первого лица закреплён под номером **0**. Остальные персонажи отсортированы по числу упоминаний.","");
  } else if ((data.narratorCandidateIds??[]).length>1) {
    lines.push("Найдено несколько возможных рассказчиков от первого лица; №0 не назначен автоматически. Остальные персонажи отсортированы по числу упоминаний.","");
  } else {
    lines.push("Список отсортирован по числу упоминаний; при равенстве — по числу фрагментов.","");
  }

  const characters=data.characters??[];
  const narrator=data.narratorCharacterId
    ? characters.find(c=>c.characterId===data.narratorCharacterId)
    : null;
  if (narrator) lines.push(row(narrator,0,data));

  let number=1;
  for (const c of characters) {
    if (narrator && c.characterId===narrator.characterId) continue;
    lines.push(row(c,number++,data));
  }
  lines.push("");

  if ((data.ambiguities??[]).length) {
    lines.push("## Неоднозначные совпадения имён","");
    for (const a of data.ambiguities) lines.push(`- **${a.normalizedName}**: автоматически не объединено; требуется проверка, если выбран один из этих персонажей.`);
    lines.push("");
  }
  lines.push("Выбор персонажа создаёт отдельную рабочую ветку, но не запускает повторный общий разбор исходного файла.","");
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [input,out]=process.argv.slice(2);
  if (!input || !out) {
    console.error("usage: node render-roster.mjs <source-analysis.json> <roster.md>");
    process.exit(2);
  }
  const data=JSON.parse(readFileSync(input,"utf8"));
  writeFileSync(out,renderRoster(data),"utf8");
  console.log(JSON.stringify({
    ok:true,
    out,
    characters:(data.characters??[]).length,
    key:(data.characters??[]).filter(c=>c.prominence.band==="key").length,
    narratorCharacterId:data.narratorCharacterId??null
  }));
}
