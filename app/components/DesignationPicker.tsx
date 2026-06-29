"use client";

import { useState } from "react";
import { DESIGNATIONS, type RoleCode } from "@/app/lib/types";

const CUSTOM = "__custom__";

/** Department + Designation pair for the onboarding form. Picking a department
    drives the list of designations, since the department/role is shared by many
    people and the designation is what makes each person distinct. Submits the
    standard `roleCode` and `title` fields the server action already expects. */
export function DesignationPicker({
  departments,
  inputClass,
  labelClass,
}: {
  departments: { code: RoleCode; name: string }[];
  inputClass: string;
  labelClass: string;
}) {
  const first = (departments[0]?.code ?? "DES") as RoleCode;
  const [dept, setDept] = useState<RoleCode>(first);
  const [designation, setDesignation] = useState<string>(DESIGNATIONS[first]?.[0] ?? "");
  const [custom, setCustom] = useState(false);

  const options = DESIGNATIONS[dept] ?? [];

  function onDept(code: RoleCode) {
    setDept(code);
    setCustom(false);
    setDesignation(DESIGNATIONS[code]?.[0] ?? "");
  }

  return (
    <>
      <div>
        <label className={labelClass}>Department</label>
        <select name="roleCode" value={dept} onChange={(e) => onDept(e.target.value as RoleCode)} className={inputClass}>
          {departments.map((d) => (
            <option key={d.code} value={d.code}>
              {d.code} · {d.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Designation</label>
        {custom ? (
          <div className="flex items-center gap-2">
            <input
              name="title"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Senior Process Engineer"
              required
              autoFocus
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => { setCustom(false); setDesignation(options[0] ?? ""); }}
              className="shrink-0 text-[0.6rem] text-faint hover:text-brand"
              title="Pick from suggestions"
            >
              list
            </button>
          </div>
        ) : (
          <select
            name="title"
            value={designation}
            onChange={(e) => {
              if (e.target.value === CUSTOM) { setCustom(true); setDesignation(""); }
              else setDesignation(e.target.value);
            }}
            className={inputClass}
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
            <option value={CUSTOM}>Custom…</option>
          </select>
        )}
      </div>
    </>
  );
}
