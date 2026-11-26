"use client";

import { Editor, type EditorProps } from "@/app/(dashboard)/dashboard/undangan/[id]/edit/Editor";

import { saveClaimStepAction } from "../actions";
import { ClaimConfirm } from "./ClaimConfirm";

/** Editor mode link khusus: bertahap + langkah konfirmasi. */
export function ClaimEditor({
  props,
  step,
  expiresAt,
}: {
  props: EditorProps;
  step: number;
  expiresAt: string;
}) {
  return (
    <Editor
      {...props}
      mode="claim"
      backHref={null}
      previewBase={`/akun/undangan/${props.id}/pratinjau`}
      steps={{ initial: step, onStep: (n) => void saveClaimStepAction(props.id, n) }}
      finalStep={({ flushSave }) => (
        <ClaimConfirm invitationId={props.id} expiresAt={expiresAt} flushSave={flushSave} />
      )}
    />
  );
}
