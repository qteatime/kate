import { BitsyImporter } from "./bitsy";

interface Parser {
  accepts(files: KateTypes.DeviceFileHandle[]): Promise<Importer[]>;
}

interface Importer {}

const parsers = [BitsyImporter];

export async function candidates(files: KateTypes.DeviceFileHandle[]) {
  return (await Promise.all(parsers.map((p) => p.accepts(files)))).flat();
}
