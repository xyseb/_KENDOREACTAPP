// import React, {
//   useState,
//   useRef,
//   useEffect,
//   useLayoutEffect,
//   useMemo,
//   useCallback,
// } from "react";
// import { createPortal } from "react-dom";
// import "./HTooltip.scss";

// type TooltipPosition =
//   | "top"
//   | "top-left"
//   | "top-right"
//   | "bottom"
//   | "bottom-left"
//   | "bottom-right"
//   | "left"
//   | "right";

// interface TooltipProps {
//   content: React.ReactNode | "title";
//   position?: TooltipPosition;
//   gap?: number;
//   open?: boolean;
//   defaultOpen?: boolean;
//   children?: React.ReactElement;
//   anchorRef?: React.RefObject<HTMLElement>;
// }

// const isTouchDevice =
//   typeof window !== "undefined" &&
//   ("ontouchstart" in window || navigator.maxTouchPoints > 0);

// export const HTooltip: React.FC<TooltipProps> = ({
//   content,
//   position = "top",
//   gap = 5,
//   open,
//   defaultOpen,
//   children,
//   anchorRef,
// }) => {
//   /* ================= STATE ================= */

//   const [visible, setVisible] = useState<boolean>(
//     open ?? defaultOpen ?? false
//   );

//   const [style, setStyle] = useState<React.CSSProperties>({});
//   const [ready, setReady] = useState(false);

//   const internalRef = useRef<HTMLElement>(null);
//   const tooltipRef = useRef<HTMLDivElement>(null);

//   const target = anchorRef?.current || internalRef.current;
//   const isControlled = open !== undefined;

//   /* ================= OPEN CONTRÔLÉ ================= */

//   useEffect(() => {
//     if (open !== undefined) {
//       setVisible(open);
//     }
//   }, [open]);

//   /* ================= CONTENT ================= */

//   const getContent = () => {
//     if (content === "title" && target) {
//       return target.getAttribute("title") || "";
//     }
//     return content;
//   };

//   /* ================= POSITION CALC ================= */

//   const computePosition = useCallback(() => {
//     if (!target || !tooltipRef.current) return;

//     const t = target.getBoundingClientRect();
//     const tt = tooltipRef.current.getBoundingClientRect();

//     const s: React.CSSProperties = { position: "fixed" };

//     switch (position) {
//       case "top":
//         s.bottom = window.innerHeight - t.top + gap;
//         s.left = t.left + t.width / 2 - tt.width / 2;
//         break;

//       case "bottom":
//         s.top = t.bottom + gap;
//         s.left = t.left + t.width / 2 - tt.width / 2;
//         break;

//       case "left":
//         s.top = t.top + t.height / 2 - tt.height / 2;
//         s.right = window.innerWidth - t.left + gap;
//         break;

//       case "right":
//         s.top = t.top + t.height / 2 - tt.height / 2;
//         s.left = t.right + gap;
//         break;

//       case "top-left":
//         s.bottom = window.innerHeight - t.top + gap;
//         s.right = window.innerWidth - t.left + gap;
//         break;

//       case "top-right":
//         s.bottom = window.innerHeight - t.top + gap;
//         s.left = t.right + gap;
//         break;

//       case "bottom-left":
//         s.top = t.bottom + gap;
//         s.right = window.innerWidth - t.left + gap;
//         break;

//       case "bottom-right":
//         s.top = t.bottom + gap;
//         s.left = t.right + gap;
//         break;
//     }

//     setStyle(s);
//   }, [target, position, gap]);

//   /* ================= POSITION EFFECT ================= */

//   /**
//    * useLayoutEffect est utilisé ici pour :
//    * - mesurer le tooltip APRÈS le layout DOM/CSS
//    * - mais AVANT le paint (pas de flicker)
//    *
//    * ⚠️ Cependant :
//    * - certaines polices / emojis peuvent encore
//    *   modifier la largeur APRÈS le layout initial
//    *
//    * ➜ On utilise donc requestAnimationFrame
//    *   pour vérifier si la largeur a changé
//    *   et recalculer si nécessaire
//    */
//   useLayoutEffect(() => {
//     if (!visible) return;

//     setReady(false);

//     // 1️⃣ première mesure synchrone
//     computePosition();

//     const tt = tooltipRef.current;
//     if (!tt) return;

//     const widthBefore = tt.getBoundingClientRect().width;

//     // 2️⃣ frame suivante : vérification de stabilité
//     requestAnimationFrame(() => {
//       if (!tooltipRef.current) return;

//       const widthAfter =
//         tooltipRef.current.getBoundingClientRect().width;

//       if (widthBefore !== widthAfter) {
//         computePosition();
//       }

//       setReady(true);
//     });
//   }, [visible, computePosition]);

//   /* ================= RESET READY ================= */

//   useEffect(() => {
//     if (!visible) setReady(false);
//   }, [visible]);

//   /* ================= ANCHOR REF MODE ================= */

//   useEffect(() => {
//     if (!anchorRef?.current || children || isControlled) return;

//     const el = anchorRef.current;

//     const show = () => setVisible(true);
//     const hide = () => setVisible(false);
//     const toggle = () => setVisible(v => !v);

//     if (isTouchDevice) {
//       el.addEventListener("click", toggle);
//     } else {
//       el.addEventListener("mouseenter", show);
//       el.addEventListener("mouseleave", hide);
//     }

//     return () => {
//       el.removeEventListener("mouseenter", show);
//       el.removeEventListener("mouseleave", hide);
//       el.removeEventListener("click", toggle);
//     };
//   }, [anchorRef, children, isControlled]);

//   /* ================= JSX MODE ================= */

//   const childProps = useMemo(() => {
//     if (!children || isControlled) return undefined;

//     return isTouchDevice
//       ? {
//           onClick: () => setVisible(v => !v),
//           ref: internalRef,
//         }
//       : {
//           onMouseEnter: () => setVisible(true),
//           onMouseLeave: () => setVisible(false),
//           ref: internalRef,
//         };
//   }, [children, isControlled]);

//   /* ================= RENDER ================= */

//   return (
//     <>
//       {children && React.cloneElement(children, childProps)}

//       {visible &&
//         createPortal(
//           <div
//             ref={tooltipRef}
//             className="h-tooltip"
//             style={{
//               ...style,
//               visibility: ready ? "visible" : "hidden",
//             }}
//           >
//             {getContent()}
//           </div>,
//           document.body
//         )}
//     </>
//   );
// };


// import React, {
//   useState,
//   useRef,
//   useLayoutEffect,
//   useEffect,
//   useMemo,
//   useCallback,
// } from "react";
// import { createPortal } from "react-dom";
// import "./HTooltip.scss";

// type TooltipPosition =
//   | "top"
//   | "top-left"
//   | "top-right"
//   | "bottom"
//   | "bottom-left"
//   | "bottom-right"
//   | "left"
//   | "right";

// interface TooltipProps {
//   content: React.ReactNode | "title";
//   position?: TooltipPosition;
//   gap?: number;
//   open?: boolean;
//   defaultOpen?: boolean;
//   children?: React.ReactElement;
//   anchorRef?: React.RefObject<HTMLElement>;
// }

// const isTouchDevice =
//   typeof window !== "undefined" &&
//   ("ontouchstart" in window || navigator.maxTouchPoints > 0);

// export const HTooltip: React.FC<TooltipProps> = ({
//   content,
//   position = "top",
//   gap = 5,
//   open,
//   defaultOpen,
//   children,
//   anchorRef,
// }) => {
//   const [visible, setVisible] = useState(open ?? defaultOpen ?? false);
//   const [style, setStyle] = useState<React.CSSProperties>({});
//   const [ready, setReady] = useState(false);

//   const internalRef = useRef<HTMLElement>(null);
//   const tooltipRef = useRef<HTMLDivElement>(null);

//   const target = anchorRef?.current || internalRef.current;
//   const isControlled = open !== undefined;

//   /* ================= CONTENU ================= */

//   const getContent = () => {
//     if (content === "title" && target) {
//       return target.getAttribute("title") || "";
//     }
//     return content;
//   };

//   /* =========================================================
//      COMPUTE POSITION
//      =========================================================
//      useCallback est indispensable ici :
//      - évite la recréation de la fonction
//      - permet de l’utiliser dans useLayoutEffect sans boucle infinie
//   */
//   const computePosition = useCallback(() => {
//     if (!target || !tooltipRef.current) return;

//     const t = target.getBoundingClientRect();
//     const tt = tooltipRef.current.getBoundingClientRect();

//     let top: number | undefined;
//     let left: number | undefined;
//     let right: number | undefined;
//     let bottom: number | undefined;

//     switch (position) {
//       case "top":
//         bottom = window.innerHeight - t.top + gap;
//         left = t.left + t.width / 2 - tt.width / 2;
//         break;
//       case "bottom":
//         top = t.bottom + gap;
//         left = t.left + t.width / 2 - tt.width / 2;
//         break;
//       case "left":
//         top = t.top + t.height / 2 - tt.height / 2;
//         right = window.innerWidth - t.left + gap;
//         break;
//       case "right":
//         top = t.top + t.height / 2 - tt.height / 2;
//         left = t.right + gap;
//         break;
//       case "top-left":
//         bottom = window.innerHeight - t.top + gap;
//         right = window.innerWidth - t.left + gap;
//         break;
//       case "top-right":
//         bottom = window.innerHeight - t.top + gap;
//         left = t.right + gap;
//         break;
//       case "bottom-left":
//         top = t.bottom + gap;
//         right = window.innerWidth - t.left + gap;
//         break;
//       case "bottom-right":
//         top = t.bottom + gap;
//         left = t.right + gap;
//         break;
//     }

//     /* ================= COLLISION VIEWPORT =================
//        Empêche le tooltip de sortir de l’écran
//     */
//     if (left !== undefined) {
//       left = Math.max(8, Math.min(left, window.innerWidth - tt.width - 8));
//     }
//     if (top !== undefined) {
//       top = Math.max(8, Math.min(top, window.innerHeight - tt.height - 8));
//     }

//     setStyle({
//       position: "fixed",
//       top,
//       left,
//       right,
//       bottom,
//     });

//     setReady(true);
//   }, [gap, position, target]);

//   /* =========================================================
//      POSITIONNEMENT PRINCIPAL
//      =========================================================
//      useLayoutEffect :
//      - s’exécute AVANT le paint
//      - évite un render avec mauvaise position
//      - requestAnimationFrame garantit que :
//        DOM + styles + fonts sont bien calculés
//   */
//   useLayoutEffect(() => {
//     if (!visible) return;

//     setReady(false);

//     const raf = requestAnimationFrame(() => {
//       computePosition();
//     });

//     return () => cancelAnimationFrame(raf);
//   }, [visible, computePosition]);

//   /* ================= RESIZE OBSERVER =================
//      Si le contenu du tooltip change de taille :
//      → on recalcule la position automatiquement
//   */
//   useEffect(() => {
//     if (!visible || !tooltipRef.current) return;

//     const ro = new ResizeObserver(() => {
//       computePosition();
//     });

//     ro.observe(tooltipRef.current);

//     return () => ro.disconnect();
//   }, [visible, computePosition]);

//   /* ================= SCROLL / ZOOM / RESIZE =================
//      Permet au tooltip de suivre sa cible
//   */
//   useEffect(() => {
//     if (!visible) return;

//     const handler = () => computePosition();

//     window.addEventListener("scroll", handler, true);
//     window.addEventListener("resize", handler);

//     return () => {
//       window.removeEventListener("scroll", handler, true);
//       window.removeEventListener("resize", handler);
//     };
//   }, [visible, computePosition]);

//   /* ================= OPEN CONTROL ================= */
//   useEffect(() => {
//     if (open !== undefined) setVisible(open);
//   }, [open]);

//   /* ================= EVENTS ================= */

//   useEffect(() => {
//     if (!anchorRef?.current || children || isControlled) return;

//     const el = anchorRef.current;

//     const show = () => setVisible(true);
//     const hide = () => setVisible(false);
//     const toggle = () => setVisible(v => !v);

//     if (isTouchDevice) {
//       el.addEventListener("click", toggle);
//     } else {
//       el.addEventListener("mouseenter", show);
//       el.addEventListener("mouseleave", hide);
//     }

//     return () => {
//       el.removeEventListener("mouseenter", show);
//       el.removeEventListener("mouseleave", hide);
//       el.removeEventListener("click", toggle);
//     };
//   }, [anchorRef, children, isControlled]);

//   const childProps = useMemo(() => {
//     if (!children || isControlled) return undefined;

//     return isTouchDevice
//       ? { onClick: () => setVisible(v => !v), ref: internalRef }
//       : {
//           onMouseEnter: () => setVisible(true),
//           onMouseLeave: () => setVisible(false),
//           ref: internalRef,
//         };
//   }, [children, isControlled]);

//   return (
//     <>
//       {children && React.cloneElement(children, childProps)}
//       {visible &&
//         createPortal(
//           <div
//             ref={tooltipRef}
//             className="h-tooltip"
//             style={{
//               ...style,
//               visibility: ready ? "visible" : "hidden",
//             }}
//           >
//             {getContent()}
//           </div>,
//           document.body
//         )}
//     </>
//   );
// };

// import React, {
//   useState,
//   useRef,
//   useLayoutEffect,
//   useEffect,
//   useCallback,
//   useMemo,
// } from "react";
// import { createPortal } from "react-dom";
// import "./HTooltip.scss";

// /* ================= TYPES ================= */

// type TooltipPosition =
//   | "top"
//   | "top-left"
//   | "top-right"
//   | "bottom"
//   | "bottom-left"
//   | "bottom-right"
//   | "left"
//   | "right";

// interface TooltipProps {
//   content: React.ReactNode | "title";
//   position?: TooltipPosition;
//   gap?: number;
//   open?: boolean;
//   defaultOpen?: boolean;
//   children?: React.ReactElement;
//   anchorRef?: React.RefObject<HTMLElement>;
// }

// /* ================= ENV ================= */

// const isTouchDevice =
//   typeof window !== "undefined" &&
//   ("ontouchstart" in window || navigator.maxTouchPoints > 0);

// /* ================= FLIP ================= */

// const flipMap: Record<TooltipPosition, TooltipPosition> = {
//   top: "bottom",
//   "top-left": "bottom-left",
//   "top-right": "bottom-right",
//   bottom: "top",
//   "bottom-left": "top-left",
//   "bottom-right": "top-right",
//   left: "right",
//   right: "left",
// };

// /* ================= GEOMETRY ================= */

// function computeStyle(
//   position: TooltipPosition,
//   t: DOMRect,
//   tt: DOMRect,
//   gap: number
// ): React.CSSProperties {
//   const s: React.CSSProperties = { position: "fixed" };

//   switch (position) {
//     case "top":
//       s.top = t.top - tt.height - gap;
//       s.left = t.left + t.width / 2 - tt.width / 2;
//       break;

//     case "bottom":
//       s.top = t.bottom + gap;
//       s.left = t.left + t.width / 2 - tt.width / 2;
//       break;

//     case "left":
//       s.top = t.top + t.height / 2 - tt.height / 2;
//       s.left = t.left - tt.width - gap;
//       break;

//     case "right":
//       s.top = t.top + t.height / 2 - tt.height / 2;
//       s.left = t.right + gap;
//       break;

//     case "top-left":
//       s.top = t.top - tt.height - gap;
//       s.left = t.left;
//       break;

//     case "top-right":
//       s.top = t.top - tt.height - gap;
//       s.left = t.right - tt.width;
//       break;

//     case "bottom-left":
//       s.top = t.bottom + gap;
//       s.left = t.left;
//       break;

//     case "bottom-right":
//       s.top = t.bottom + gap;
//       s.left = t.right - tt.width;
//       break;
//   }

//   return s;
// }

// /* ================= COMPONENT ================= */

// export const HTooltip: React.FC<TooltipProps> = ({
//   content,
//   position = "top",
//   gap = 5,
//   open,
//   defaultOpen,
//   children,
//   anchorRef,
// }) => {
//   const [visible, setVisible] = useState(open ?? defaultOpen ?? false);
//   const [style, setStyle] = useState<React.CSSProperties>({
//     opacity: 0,
//     pointerEvents: "none",
//   });
//   const [finalPosition, setFinalPosition] =
//     useState<TooltipPosition>(position);

//   const internalRef = useRef<HTMLElement>(null);
//   const tooltipRef = useRef<HTMLDivElement>(null);

//   const target = anchorRef?.current || internalRef.current;
//   const isControlled = open !== undefined;

//   /* ================= CONTROLLED ================= */

//   useEffect(() => {
//     if (open !== undefined) setVisible(open);
//   }, [open]);

//   /* ================= CONTENT ================= */

//   const getContent = () => {
//     if (content === "title" && target) {
//       return target.getAttribute("title") || "";
//     }
//     return content;
//   };

//   /* ================= POSITIONING (NO FLICKER) ================= */

// const computePosition = useCallback(() => {
//   if (!target || !tooltipRef.current) return;

//   const t = target.getBoundingClientRect();
//   const tt = tooltipRef.current.getBoundingClientRect();

//   let pos = position;

//   // Calcul initial (toujours numérique)
//   let style = computeStyle(pos, t, tt, gap);

//   // Extraction numérique sécurisée
//   let top = typeof style.top === "number" ? style.top : 0;
//   let left = typeof style.left === "number" ? style.left : 0;

//   const overflows =
//     top < 0 ||
//     left < 0 ||
//     left + tt.width > window.innerWidth ||
//     top + tt.height > window.innerHeight;

//   // Flip automatique si débordement
//   if (overflows) {
//     pos = flipMap[position];
//     style = computeStyle(pos, t, tt, gap);

//     top = typeof style.top === "number" ? style.top : 0;
//     left = typeof style.left === "number" ? style.left : 0;
//   }

//   // Clamp dans le viewport
//   top = Math.max(4, Math.min(top, window.innerHeight - tt.height - 4));
//   left = Math.max(4, Math.min(left, window.innerWidth - tt.width - 4));

//   setFinalPosition(pos);
//   setStyle({
//     ...style,
//     top,
//     left,
//     opacity: 1,
//     pointerEvents: "auto",
//   });
// }, [position, gap, target]);


//   /**
//    * useLayoutEffect :
//    * - exécuté AVANT le paint navigateur
//    * - garantit que le tooltip n'est jamais visible mal positionné
//    */
//   useLayoutEffect(() => {
//     if (!visible) return;

//     setStyle(s => ({ ...s, opacity: 0 }));
//     computePosition();
//   }, [visible, computePosition]);

//   /* ================= SCROLL / RESIZE ================= */

//   useEffect(() => {
//     if (!visible) return;

//     const handler = () => computePosition();
//     window.addEventListener("scroll", handler, true);
//     window.addEventListener("resize", handler);

//     return () => {
//       window.removeEventListener("scroll", handler, true);
//       window.removeEventListener("resize", handler);
//     };
//   }, [visible, computePosition]);

//   /* ================= RESIZE OBSERVER ================= */

//   useEffect(() => {
//     if (!tooltipRef.current) return;

//     const ro = new ResizeObserver(() => computePosition());
//     ro.observe(tooltipRef.current);

//     return () => ro.disconnect();
//   }, [computePosition]);

//   /* ================= ANCHOR REF HANDLERS ================= */

//   useEffect(() => {
//     if (!anchorRef?.current || isControlled) return;

//     const el = anchorRef.current;

//     const openTooltip = () => setVisible(true);
//     const closeTooltip = () => setVisible(false);

//     if (isTouchDevice) {
//       el.addEventListener("click", openTooltip);
//     } else {
//       el.addEventListener("mouseenter", openTooltip);
//       el.addEventListener("mouseleave", closeTooltip);
//     }

//     return () => {
//       el.removeEventListener("click", openTooltip);
//       el.removeEventListener("mouseenter", openTooltip);
//       el.removeEventListener("mouseleave", closeTooltip);
//     };
//   }, [anchorRef, isControlled]);

//   /* ================= CHILDREN MODE ================= */

//   const childProps = useMemo(() => {
//     if (!children || isControlled) return undefined;

//     return isTouchDevice
//       ? { onClick: () => setVisible(v => !v), ref: internalRef }
//       : {
//           onMouseEnter: () => setVisible(true),
//           onMouseLeave: () => setVisible(false),
//           ref: internalRef,
//         };
//   }, [children, isControlled]);

//   /* ================= RENDER ================= */

//   return (
//     <>
//       {children && React.cloneElement(children, childProps)}

//       {visible &&
//         createPortal(
//           <div
//             ref={tooltipRef}
//             className={`h-tooltip h-tooltip--${finalPosition}`}
//             style={style}
//           >
//             {getContent()}
//           </div>,
//           document.body
//         )}
//     </>
//   );
// };



// import React, {
//   useState,
//   useRef,
//   useLayoutEffect,
//   useEffect,
//   useCallback,
//   useMemo,
// } from "react";
// import { createPortal } from "react-dom";
// import "./HTooltip.scss";
// import { useMediaQuery } from "../../hooks/useMediaQuery";

// /* ================= TYPES ================= */

// type TooltipPosition =
//   | "top"
//   | "top-left"
//   | "top-right"
//   | "bottom"
//   | "bottom-left"
//   | "bottom-right"
//   | "left"
//   | "right";

// interface TooltipProps {
//   content: React.ReactNode | "title";
//   position?: TooltipPosition;
//   gap?: number;
//   open?: boolean;
//   defaultOpen?: boolean;
//   children?: React.ReactElement;
//   anchorRef?: React.RefObject<HTMLElement>;
// }

// /* ================= FLIP ================= */

// const flipMap: Record<TooltipPosition, TooltipPosition> = {
//   top: "bottom",
//   "top-left": "bottom-left",
//   "top-right": "bottom-right",
//   bottom: "top",
//   "bottom-left": "top-left",
//   "bottom-right": "top-right",
//   left: "right",
//   right: "left",
// };

// /* ================= GEOMETRY ================= */

// function computeStyle(
//   position: TooltipPosition,
//   t: DOMRect,
//   tt: DOMRect,
//   gap: number
// ): React.CSSProperties {
//   const s: React.CSSProperties = { position: "fixed" };

//   switch (position) {
//     case "top":
//       s.top = t.top - tt.height - gap;
//       s.left = t.left + t.width / 2 - tt.width / 2;
//       break;

//     case "bottom":
//       s.top = t.bottom + gap;
//       s.left = t.left + t.width / 2 - tt.width / 2;
//       break;

//     case "left":
//       s.top = t.top + t.height / 2 - tt.height / 2;
//       s.left = t.left - tt.width - gap;
//       break;

//     case "right":
//       s.top = t.top + t.height / 2 - tt.height / 2;
//       s.left = t.right + gap;
//       break;

//     case "top-left":
//       s.top = t.top - tt.height - gap;
//       s.left = t.left;
//       break;

//     case "top-right":
//       s.top = t.top - tt.height - gap;
//       s.left = t.right - tt.width;
//       break;

//     case "bottom-left":
//       s.top = t.bottom + gap;
//       s.left = t.left;
//       break;

//     case "bottom-right":
//       s.top = t.bottom + gap;
//       s.left = t.right - tt.width;
//       break;
//   }

//   return s;
// }

// /* ================= COMPONENT ================= */

// export const HTooltip: React.FC<TooltipProps> = ({
//   content,
//   position = "top",
//   gap = 6,
//   open,
//   defaultOpen,
//   children,
//   anchorRef,
// }) => {
//   const [visible, setVisible] = useState(open ?? defaultOpen ?? false);
//   const [style, setStyle] = useState<React.CSSProperties>({
//     opacity: 0,
//     visibility: "hidden",
//     pointerEvents: "none",
//   });
//   const [finalPosition, setFinalPosition] =
//     useState<TooltipPosition>(position);

//   const internalRef = useRef<HTMLElement>(null);
//   const tooltipRef = useRef<HTMLDivElement>(null);

//   const isTactile = useMediaQuery().IsTouchScreen;

//   const target = anchorRef?.current || internalRef.current;
//   const isControlled = open !== undefined;

//   /* ================= CONTROLLED ================= */

//   useEffect(() => {
//     if (open !== undefined) {
//       setVisible(open);
//     }
//   }, [open]);

//   /* ================= CONTENT ================= */

//   const getContent = () => {
//     if (content === "title" && target) {
//       return target.getAttribute("title") || "";
//     }
//     return content;
//   };

//   /* ================= POSITION ================= */

//   const computePosition = useCallback(() => {
//     if (!target || !tooltipRef.current) return;

//     // Décalage d’une frame pour garantir un layout DOM stable
//     requestAnimationFrame(() => {
//       if (!tooltipRef.current) return;

//       const t = target.getBoundingClientRect();
//       const tt = tooltipRef.current.getBoundingClientRect();

//       let pos = position;
//       let s = computeStyle(pos, t, tt, gap);

//       let top = typeof s.top === "number" ? s.top : 0;
//       let left = typeof s.left === "number" ? s.left : 0;

//       const overflow =
//         top < 0 ||
//         left < 0 ||
//         left + tt.width > window.innerWidth ||
//         top + tt.height > window.innerHeight;

//       if (overflow) {
//         pos = flipMap[position];
//         s = computeStyle(pos, t, tt, gap);
//         top = typeof s.top === "number" ? s.top : top;
//         left = typeof s.left === "number" ? s.left : left;
//       }

//       top = Math.max(4, Math.min(top, window.innerHeight - tt.height - 4));
//       left = Math.max(4, Math.min(left, window.innerWidth - tt.width - 4));

//       setFinalPosition(pos);
//       setStyle({
//         ...s,
//         top,
//         left,
//         opacity: 1,
//         visibility: "visible",
//         pointerEvents: "auto",
//       });
//     });
//   }, [position, gap, target]);

//   useLayoutEffect(() => {
//     if (!visible) return;

//     setStyle(s => ({
//       ...s,
//       opacity: 0,
//       visibility: "hidden",
//       pointerEvents: "none",
//     }));

//     computePosition();
//   }, [visible, computePosition]);

//   /* ================= SCROLL / RESIZE ================= */

//   useEffect(() => {
//     if (!visible) return;

//     const handler = () => computePosition();
//     window.addEventListener("scroll", handler, true);
//     window.addEventListener("resize", handler);

//     return () => {
//       window.removeEventListener("scroll", handler, true);
//       window.removeEventListener("resize", handler);
//     };
//   }, [visible, computePosition]);

//   /* ================= RESIZE OBSERVER ================= */

//   useEffect(() => {
//     if (!tooltipRef.current) return;

//     const ro = new ResizeObserver(() => computePosition());
//     ro.observe(tooltipRef.current);

//     return () => ro.disconnect();
//   }, [computePosition]);

//   /* ================= ANCHOR REF ================= */

//   useEffect(() => {
//     if (!anchorRef?.current || isControlled) return;

//     const el = anchorRef.current;

//     const openTooltip = () => setVisible(true);
//     const closeTooltip = () => setVisible(false);

//     if (isTactile) {
//       el.addEventListener("click", openTooltip);
//     } else {
//       el.addEventListener("mouseenter", openTooltip);
//       el.addEventListener("mouseleave", closeTooltip);
//     }

//     return () => {
//       el.removeEventListener("click", openTooltip);
//       el.removeEventListener("mouseenter", openTooltip);
//       el.removeEventListener("mouseleave", closeTooltip);
//     };
//   }, [anchorRef, isControlled, isTactile]);

//   /* ================= CHILDREN ================= */

//   const childProps = useMemo(() => {
//     if (!children || isControlled) return undefined;

//     return isTactile
//       ? { onClick: () => setVisible(v => !v), ref: internalRef }
//       : {
//           onMouseEnter: () => setVisible(true),
//           onMouseLeave: () => setVisible(false),
//           ref: internalRef,
//         };
//   }, [children, isControlled, isTactile]);

//   /* ================= RENDER ================= */

//   return (
//     <>
//       {children && React.cloneElement(children, childProps)}

//       {visible &&
//         createPortal(
//           <div
//             ref={tooltipRef}
//             className={`h-tooltip h-tooltip--${finalPosition}`}
//             style={style}
//           >
//             {getContent()}
//           </div>,
//           document.body
//         )}
//     </>
//   );
// };


import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import "./HTooltip.scss";
import { useMediaQuery } from "../../hooks/useMediaQuery";

/* ================= TYPES ================= */

type TooltipPosition =
  | "top"
  | "top-left"
  | "top-right"
  | "bottom"
  | "bottom-left"
  | "bottom-right"
  | "left"
  | "right";

interface TooltipProps {
  content: React.ReactNode | "title";
  position?: TooltipPosition;
  gap?: number;
  open?: boolean;
  defaultOpen?: boolean;
  children?: React.ReactElement;
  anchorRef?: React.RefObject<HTMLElement>;
}

/* ================= FLIP ================= */

const flipMap: Record<TooltipPosition, TooltipPosition> = {
  top: "bottom",
  "top-left": "bottom-left",
  "top-right": "bottom-right",
  bottom: "top",
  "bottom-left": "top-left",
  "bottom-right": "top-right",
  left: "right",
  right: "left",
};

/* ================= GEOMETRY ================= */

function computeStyle(
  position: TooltipPosition,
  t: DOMRect,
  tt: DOMRect,
  gap: number
): { top: number; left: number } {
  switch (position) {
    case "top":
      return {
        top: t.top - tt.height - gap,
        left: t.left + t.width / 2 - tt.width / 2,
      };
    case "bottom":
      return {
        top: t.bottom + gap,
        left: t.left + t.width / 2 - tt.width / 2,
      };
    case "left":
      return {
        top: t.top + t.height / 2 - tt.height / 2,
        left: t.left - tt.width - gap,
      };
    case "right":
      return {
        top: t.top + t.height / 2 - tt.height / 2,
        left: t.right + gap,
      };
    case "top-left":
      return { top: t.top - tt.height - gap, left: t.left };
    case "top-right":
      return { top: t.top - tt.height - gap, left: t.right - tt.width };
    case "bottom-left":
      return { top: t.bottom + gap, left: t.left };
    case "bottom-right":
      return { top: t.bottom + gap, left: t.right - tt.width };
  }
}

/* ================= COMPONENT ================= */

export const HTooltip: React.FC<TooltipProps> = ({
  content,
  position = "top",
  gap = 6,
  open,
  defaultOpen = false,
  children,
  anchorRef,
}) => {
  const [visible, setVisible] = useState(open ?? defaultOpen);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [finalPosition, setFinalPosition] =
    useState<TooltipPosition>(position);

  const internalRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  /** 🔑 indique si l’ouverture vient du montage initial */
  const isInitialOpen = useRef(defaultOpen === true);

  const isTactile = useMediaQuery().IsTouchScreen;
  const target = anchorRef?.current || internalRef.current;
  const isControlled = open !== undefined;

  /* ================= CONTROLLED ================= */

  useEffect(() => {
    if (open !== undefined) setVisible(open);
  }, [open]);

  /* ================= CONTENT ================= */

  const renderedContent = useMemo(() => {
    if (content === "title" && target) {
      return target.getAttribute("title");
    }
    return content;
  }, [content, target]);

  /* ================= POSITION CORE ================= */

  const updatePosition = useCallback(() => {
    if (!target || !tooltipRef.current) return;

    const t = target.getBoundingClientRect();
    const tt = tooltipRef.current.getBoundingClientRect();

    let pos = position;
    let { top, left } = computeStyle(pos, t, tt, gap);

    const overflow =
      top < 0 ||
      left < 0 ||
      left + tt.width > window.innerWidth ||
      top + tt.height > window.innerHeight;

    if (overflow) {
      pos = flipMap[position];
      ({ top, left } = computeStyle(pos, t, tt, gap));
    }

    setFinalPosition(pos);
    setCoords({
      top: Math.max(4, Math.min(top, window.innerHeight - tt.height - 4)),
      left: Math.max(4, Math.min(left, window.innerWidth - tt.width - 4)),
    });
  }, [position, gap, target]);

  /* ================= DEFERRED POSITION ================= */

  useLayoutEffect(() => {
    if (!visible) return;

    // 🔑 double frame uniquement pour defaultOpen
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        updatePosition();
        isInitialOpen.current = false;
      });

      if (!isInitialOpen.current) {
        cancelAnimationFrame(raf2);
      }
    });

    return () => cancelAnimationFrame(raf1);
  }, [visible, updatePosition]);

  /* ================= LIVE UPDATES ================= */

  useEffect(() => {
    if (!visible) return;

    const handler = () => updatePosition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [visible, updatePosition]);

  useEffect(() => {
    if (!tooltipRef.current || !visible) return;

    const ro = new ResizeObserver(updatePosition);
    ro.observe(tooltipRef.current);

    return () => ro.disconnect();
  }, [visible, updatePosition]);

  /* ================= INTERACTIONS ================= */

  useEffect(() => {
    if (!anchorRef?.current || isControlled) return;

    const el = anchorRef.current;

    const openTooltip = () => setVisible(true);
    const closeTooltip = () => setVisible(false);

    if (isTactile) {
      el.addEventListener("click", openTooltip);
    } else {
      el.addEventListener("mouseenter", openTooltip);
      el.addEventListener("mouseleave", closeTooltip);
    }

    return () => {
      el.removeEventListener("click", openTooltip);
      el.removeEventListener("mouseenter", openTooltip);
      el.removeEventListener("mouseleave", closeTooltip);
    };
  }, [anchorRef, isControlled, isTactile]);

  const childProps = useMemo(() => {
    if (!children || isControlled) return undefined;

    return isTactile
      ? { onClick: () => setVisible(v => !v), ref: internalRef }
      : {
          onMouseEnter: () => setVisible(true),
          onMouseLeave: () => setVisible(false),
          ref: internalRef,
        };
  }, [children, isControlled, isTactile]);

  /* ================= RENDER ================= */

  return (
    <>
      {children && React.cloneElement(children, childProps)}

      {createPortal(
        <div
          ref={tooltipRef}
          className={`h-tooltip h-tooltip--${finalPosition}`}
          style={{
            top: coords.top,
            left: coords.left,
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? "auto" : "none",
          }}
        >
          {renderedContent}
        </div>,
        document.body
      )}
    </>
  );
};
