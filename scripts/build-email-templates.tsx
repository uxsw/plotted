import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { render } from "@react-email/render";
import ConfirmationEmail from "../emails/ConfirmationEmail";

// One entry per Supabase auth email template. Add more (invite, magic
// link, email change) here as their React Email components are built —
// each is independent, so this list is safe to extend incrementally.
const templates = [
  {
    name: "confirmation",
    component: <ConfirmationEmail />,
    outputPath: "supabase/templates/confirmation.html",
  },
];

async function main() {
  for (const template of templates) {
    const html = await render(template.component, { pretty: true });
    await mkdir(dirname(template.outputPath), { recursive: true });
    await writeFile(template.outputPath, html);
    console.log(`Wrote ${template.outputPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
