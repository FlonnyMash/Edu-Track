export type ResetKind = "soft" | "hard";

export type ResetActionResult =
  | {
      ok: true;
      kind: ResetKind;
    }
  | {
      ok: false;
      error: string;
    };
