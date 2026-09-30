#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const [input, out] = process.argv.slice(2);
if (!input || !out) { console.error("usage: node render-draft.mjs <draft-characters.json> <draft.md>"); process.exit(2); }
const data = JSON.parse(readFileSync(input,"utf8"));
const lines = ["# Черновик персонажей", ""];
for (const e of data.entities ?? []) {
  lines.push(`## ${e.displayName}`, "");
  if ((e.names ?? []).length > 1) lines.push(`Имена/формы: ${e.names.join(", ")}`, "");
  if (!(e.facts ?? []).length) lines.push("_Факты пока не извлечены._", "");
  else {
    for (const f of e.facts) {
      const ev = f.evidence;
      lines.push(`- **${f.path}**: ${JSON.stringify(f.value)} — ${f.origin}; «${ev.quote}» [${ev.start}:${ev.end}]`);
    }
    lines.push("");
  }
}
if ((data.ambiguities ?? []).length) {
  lines.push("## Требуют проверки", "");
  for (const a of data.ambiguities) lines.push(`- Имя «${a.normalizedName}» встречается у нескольких черновых сущностей (${a.draftIds.join(", ")}). Автоматически не объединено.`);
  lines.push("");
}
writeFileSync(out, lines.join("\n")+"\n","utf8");
console.log(JSON.stringify({ok:true, out, characters:(data.entities??[]).length, ambiguities:(data.ambiguities??[]).length}));
