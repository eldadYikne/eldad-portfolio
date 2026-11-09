"use client";

import { useEffect, useReducer, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { useWorld } from "../store";
import { Label } from "../objects/Label";
import {
  ADV,
  BOARD,
  COLS,
  FACE_Z,
  FIELDS,
  FONT_MONO,
  GLYPH,
  ROW_Y,
  SLOT_X0,
  landed,
  onBoardChange,
  visibleRows,
} from "./model";

const LABELS = { name: "NAME", email: "EMAIL", message: "MESSAGE" } as const;
const stampColor = new THREE.Color(5, 0.35, 0.35);
// Matte, so the coloured key lights don't flare across the text.
const boardMaterial = new THREE.MeshStandardMaterial({ color: "#080a12", roughness: 0.75, metalness: 0.3, envMapIntensity: 0.4 });

/**
 * The "classified transmission" board on the back wall. Always mounted, so it
 * doubles as a teaser from the rest of the world.
 */
export function ContactBoard() {
  const contact = useWorld((s) => s.contact);
  const status = useWorld((s) => s.contactStatus);
  const active = useWorld((s) => s.section === "contact");
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => onBoardChange(rerender), []);

  const empty = !contact.name && !contact.email && !contact.message;

  return (
    <group>
      <RoundedBox
        args={[BOARD.w, BOARD.h, BOARD.d]}
        radius={0.06}
        position={[BOARD.x, BOARD.y, BOARD.z]}
        material={boardMaterial}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          useWorld.getState().goTo("contact");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (useWorld.getState().section !== "contact") {
            document.body.style.cursor = "pointer";
            useWorld.getState().setTooltip({ text: "Open a secure channel", color: "#ef4444" });
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          useWorld.getState().setTooltip(null);
        }}
      >
        <Edges threshold={20} color="#ef4444" />
      </RoundedBox>

      <group position={[BOARD.x, 0, FACE_Z]}>
        <Label fontSize={0.2} position={[-BOARD.w / 2 + 0.5, BOARD.y + BOARD.h / 2 - 0.42, 0]} anchorX="left" color="#ef4444">
          ● CLASSIFIED // SECURE TRANSMISSION TO ELDAD YIKNE
        </Label>
        <Label
          bold={false}
          fontSize={0.13}
          position={[BOARD.w / 2 - 0.5, BOARD.y + BOARD.h / 2 - 0.42, 0]}
          anchorX="right"
          color="#64748b"
        >
          CHANNEL 0x45-59 · ENCRYPTED
        </Label>
        <mesh position={[0, BOARD.y + BOARD.h / 2 - 0.72, 0]}>
          <planeGeometry args={[BOARD.w - 1, 0.012]} />
          <meshBasicMaterial color={new THREE.Color(2.5, 0.2, 0.2)} toneMapped={false} />
        </mesh>

        {FIELDS.map((f) => (
          <group key={f}>
            <Label
              bold={false}
              fontSize={0.15}
              position={[SLOT_X0 - 0.35, ROW_Y[f][0], 0]}
              anchorX="right"
              color="#94a3b8"
            >
              {LABELS[f]}:
            </Label>
            {ROW_Y[f].map((y, r) => (
              <mesh key={r} position={[SLOT_X0 + (COLS * ADV) / 2, y - GLYPH * 0.62, -0.005]}>
                <planeGeometry args={[COLS * ADV, 0.008]} />
                <meshBasicMaterial color="#1e293b" />
              </mesh>
            ))}
            {visibleRows(f, contact[f], active ? landed[f] : null).map((row, r) =>
              row.trim() ? (
                <Text
                  key={r}
                  font={FONT_MONO}
                  fontSize={GLYPH}
                  position={[SLOT_X0, ROW_Y[f][r], 0]}
                  anchorX="left"
                  anchorY="middle"
                  whiteSpace="nowrap"
                  color={new THREE.Color("#e0f7ff").multiplyScalar(1.6)}
                  material-toneMapped={false}
                >
                  {row}
                </Text>
              ) : null
            )}
          </group>
        ))}

        {empty && (
          <Label bold={false} fontSize={0.16} position={[SLOT_X0 + 2.6, ROW_Y.message[1], 0]} color="#334155">
            {active ? "start typing… agents are standing by" : "click to open a secure channel"}
          </Label>
        )}

        <Label bold={false} fontSize={0.12} position={[-BOARD.w / 2 + 0.5, BOARD.y - BOARD.h / 2 + 0.35, 0]} anchorX="left" color="#475569">
          {status === "sending" ? "STATUS: TRANSMITTING…" : status === "sent" ? "STATUS: DELIVERED" : "STATUS: AWAITING INPUT"}
        </Label>

        {status === "sent" && <Stamp />}
      </group>
    </group>
  );
}

/** Slams onto the board when the message is delivered. */
function Stamp() {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    const k = Math.min(1, t.current / 0.22);
    const s = THREE.MathUtils.lerp(3.2, 1, 1 - Math.pow(1 - k, 3));
    if (ref.current) {
      ref.current.scale.setScalar(s);
      ref.current.visible = true;
    }
  });
  return (
    <group ref={ref} position={[2.6, BOARD.y - 0.4, 0.05]} rotation={[0, 0, -0.18]} visible={false}>
      <Label fontSize={0.9} color={stampColor} material-toneMapped={false} outlineWidth={0.02} outlineColor="#450a0a">
        TRANSMITTED
      </Label>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[6.6, 1.25]} />
        <meshBasicMaterial visible={false} />
        <Edges color={stampColor} lineWidth={3} />
      </mesh>
    </group>
  );
}
