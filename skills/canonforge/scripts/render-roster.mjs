#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const [input,out]=process.argv.slice(2);
if (!input || !out) {
  console.error("usage: node render-roster.mjs <source-analysis.json> <roster.md>");
  process.exit(2);
}
const data=JSON.parse(readFileSync(input,"utf8"));
const lines=["# Найденные персонажи",""];
lines.push(`Источник разобран один раз: ${data.chunking.chunkCount} фрагм.; дальнейшие ветки используют этот общий разбор.`,"");
lines.push("Список отсортирован по числу упоминаний; при равенстве — по числу фрагментов.","");

function bandLabel(band) {
  if (band==="key") return "ключевой";
  if (band==="recurring") return "повторяющийся";
  return "эпизодический";
}

function row(c,index) {
  const aliases=(c.names??[]).filter(n=>n!==c.displayName);
  const aliasText=aliases.length?` — также: ${aliases.join(", ")}`:"";
  return `${index+1}. **${c.displayName}**${aliasText}; упоминаний: ${c.mentionCount}; фрагментов: ${c.chunkIds.length}/${data.chunking.chunkCount}; ${bandLabel(c.prominence.band)}`;
}

(data.characters??[]).forEach((c,i)=>lines.push(row(c,i)));
lines.push("");

if ((data.ambiguities??[]).length) {
  lines.push("## Неоднозначные совпадения имён","");
  for (const a of data.ambiguities) lines.push(`- **${a.normalizedName}**: автоматически не объединено; требуется проверка, если выбран один из этих персонажей.`);
  lines.push("");
}
lines.push("Выбор персонажа создаёт отдельную рабочую ветку, но не запускает повторный общий разбор исходного файла.","");
writeFileSync(out,lines.join("\n"),"utf8");
console.log(JSON.stringify({
  ok:true,
  out,
  characters:(data.characters??[]).length,
  key:(data.characters??[]).filter(c=>c.prominence.band==="key").length
}));
