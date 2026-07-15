import { LockKeyhole } from "lucide-react";
import { useApp } from "../App";

/** Local explanation shown beside controls disabled by the startup recovery gate. */
export function MutationBlockedNotice() {
    const { mutationsBlocked } = useApp();
    if (!mutationsBlocked) return null;
    return (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/8 px-3 py-2 text-[11px] text-warning">
            <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
            Operaciones de escritura pausadas hasta resolver o verificar el estado de recuperación del encabezado.
        </div>
    );
}
