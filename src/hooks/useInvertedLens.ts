"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Point = {
  x: number;
  y: number;
};

type TitleMotion = {
  x: number;
  y: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
};

const zeroTitleMotion: TitleMotion = {
  x: 0,
  y: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
};
const titleSmoothing = 0.12;
const orbSafeGap = 10;
const orbSizeSmoothing = 0.16;

// 反色透镜（黑色大圆）动效参数
const lensStiffness = 0.18; // 弹簧刚度
const lensDamping = 0.72; // 阻尼，数值越小越弹
const lensStretch = 0.55; // 速度→沿移动方向拉长系数
const lensSqueeze = 0.32; // 速度→垂直方向收缩系数
const lensBreathAmp = 1.6; // 静止呼吸幅度（px）
const lensBreathSpeed = 0.0018; // 呼吸角速度
const edgeSoftZone = 14; // 边缘融入触发距离（px，叠加半径比例）
const edgeCompress = 0.55; // 边缘法向最大压扁比例
const edgeSpread = 0.5; // 边缘切向铺开拉长比例
const polygonPoints = 40; // 椭圆 polygon 采样点数

function setTitleMotionVariables(
  element: HTMLElement,
  motion: TitleMotion,
) {
  element.style.setProperty("--title-x", `${motion.x}px`);
  element.style.setProperty("--title-y", `${motion.y}px`);
  element.style.setProperty("--title-rotate-x", `${motion.rotateX}deg`);
  element.style.setProperty("--title-rotate-y", `${motion.rotateY}deg`);
  element.style.setProperty("--title-rotate-z", `${motion.rotateZ}deg`);

  element.style.setProperty("--title-middle-x", `${motion.x * 0.08}px`);
  element.style.setProperty("--title-middle-y", `${motion.y * 0.08}px`);
  element.style.setProperty(
    "--title-middle-rotate-x",
    `${motion.rotateX * 0.08}deg`,
  );
  element.style.setProperty(
    "--title-middle-rotate-y",
    `${motion.rotateY * 0.08}deg`,
  );
  element.style.setProperty(
    "--title-middle-rotate-z",
    `${motion.rotateZ * 0.08}deg`,
  );

  element.style.setProperty("--title-signature-x", `${motion.x * -0.18}px`);
  element.style.setProperty("--title-signature-y", `${motion.y * -0.18}px`);
  element.style.setProperty(
    "--title-signature-rotate-x",
    `${motion.rotateX * -0.18}deg`,
  );
  element.style.setProperty(
    "--title-signature-rotate-y",
    `${motion.rotateY * -0.18}deg`,
  );
  element.style.setProperty(
    "--title-signature-rotate-z",
    `${motion.rotateZ * -0.18}deg`,
  );
}

function getResponsiveOrbRadius(width: number, height: number) {
  const preferredRadius = Math.min(170, Math.max(width * 0.11, 115));
  const mobileRadiusLimit = width <= 768 ? width * 0.35 : preferredRadius;
  const boundaryRadiusLimit = Math.max(
    0,
    Math.min(width / 2 - orbSafeGap, height / 2 - orbSafeGap),
  );

  return Math.min(preferredRadius, mobileRadiusLimit, boundaryRadiusLimit);
}

function clampOrbTarget(
  point: Point,
  width: number,
  height: number,
  radius: number,
) {
  const inset = radius + orbSafeGap;

  return {
    x:
      width <= inset * 2
        ? width / 2
        : Math.max(inset, Math.min(point.x, width - inset)),
    y:
      height <= inset * 2
        ? height / 2
        : Math.max(inset, Math.min(point.y, height - inset)),
  };
}

// 反色透镜交互 hook：弹簧跟随 + 速度椭圆拉长 + 静止呼吸 + 边缘水滴贴墙
// 物理逻辑与原 HeroSection 内联实现逐字一致，仅做结构抽取
export function useInvertedLens() {
  const [isFlipped, setIsFlipped] = useState(false);
  const maskLayerRef = useRef<HTMLDivElement>(null);
  const frontFaceRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const targetRef = useRef<Point>({ x: -300, y: -300 });
  const positionRef = useRef<Point>({ x: -300, y: -300 });
  const velocityRef = useRef<Point>({ x: 0, y: 0 });
  const radiusRef = useRef(0);
  const targetRadiusRef = useRef(0);
  const titleTargetRef = useRef<TitleMotion>({ ...zeroTitleMotion });
  const titleMotionRef = useRef<TitleMotion>({ ...zeroTitleMotion });
  const isPointerInsideRef = useRef(false);
  const hasPointerPositionRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const canFollowPointerRef = useRef(false);
  const frameSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateInteractionPreferences = () => {
      reducedMotionRef.current = reducedMotionQuery.matches;
      canFollowPointerRef.current =
        pointerQuery.matches && !reducedMotionQuery.matches;

      if (!canFollowPointerRef.current) {
        isPointerInsideRef.current = false;
        titleTargetRef.current = { ...zeroTitleMotion };
        titleMotionRef.current = { ...zeroTitleMotion };
        radiusRef.current = 0;
        targetRadiusRef.current = 0;
        velocityRef.current = { x: 0, y: 0 };

        if (frontFaceRef.current) {
          setTitleMotionVariables(frontFaceRef.current, zeroTitleMotion);
        }

        if (maskLayerRef.current) {
          maskLayerRef.current.style.opacity = "0";
          maskLayerRef.current.style.clipPath = "none";
        }
      }
    };

    updateInteractionPreferences();
    reducedMotionQuery.addEventListener(
      "change",
      updateInteractionPreferences,
    );
    pointerQuery.addEventListener("change", updateInteractionPreferences);

    return () => {
      reducedMotionQuery.removeEventListener(
        "change",
        updateInteractionPreferences,
      );
      pointerQuery.removeEventListener("change", updateInteractionPreferences);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const drawMotion = (timestamp: number) => {
    const maskLayer = maskLayerRef.current;
    const frontFace = frontFaceRef.current;
    if (!maskLayer || !frontFace) {
      animationRef.current = null;
      return;
    }

    if (reducedMotionRef.current || !canFollowPointerRef.current) {
      setTitleMotionVariables(frontFace, zeroTitleMotion);
      maskLayer.style.opacity = "0";
      maskLayer.style.clipPath = "none";
      animationRef.current = null;
      return;
    }

    const position = positionRef.current;
    const target = targetRef.current;
    const velocity = velocityRef.current;
    const titleMotion = titleMotionRef.current;
    const titleTarget = titleTargetRef.current;
    const size = frameSizeRef.current;
    const targetRadius = isPointerInsideRef.current
      ? targetRadiusRef.current
      : 0;

    // 弹簧式跟随：比 lerp 更有弹性生命感
    velocity.x += (target.x - position.x) * lensStiffness;
    velocity.y += (target.y - position.y) * lensStiffness;
    velocity.x *= lensDamping;
    velocity.y *= lensDamping;
    position.x += velocity.x;
    position.y += velocity.y;

    radiusRef.current +=
      (targetRadius - radiusRef.current) * orbSizeSmoothing;

    titleMotion.x += (titleTarget.x - titleMotion.x) * titleSmoothing;
    titleMotion.y += (titleTarget.y - titleMotion.y) * titleSmoothing;
    titleMotion.rotateX +=
      (titleTarget.rotateX - titleMotion.rotateX) * titleSmoothing;
    titleMotion.rotateY +=
      (titleTarget.rotateY - titleMotion.rotateY) * titleSmoothing;
    titleMotion.rotateZ +=
      (titleTarget.rotateZ - titleMotion.rotateZ) * titleSmoothing;

    setTitleMotionVariables(frontFace, titleMotion);

    // 椭圆参数：基础半径 + 速度方向拉长 + 静止呼吸 + 边缘压扁铺开
    const baseR = Math.max(radiusRef.current, 0);
    const speed = Math.hypot(velocity.x, velocity.y);
    const now = timestamp;

    let angle = Math.atan2(velocity.y, velocity.x);
    let rAlong = baseR + Math.min(speed * lensStretch, baseR * 0.6);
    let rAcross = baseR - Math.min(speed * lensSqueeze, baseR * 0.3);

    const inEdgeZone =
      size.width > 0 &&
      size.height > 0 &&
      baseR > 0 &&
      Math.min(
        position.x,
        size.width - position.x,
        position.y,
        size.height - position.y,
      ) < edgeSoftZone + baseR * 0.4;

    if (inEdgeZone) {
      // 边缘融入：水滴贴墙，沿法向压扁、沿切向铺开
      const distLeft = position.x;
      const distRight = size.width - position.x;
      const distTop = position.y;
      const distBottom = size.height - position.y;
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);
      let nx = 0;
      let ny = 0;
      if (distLeft === minDist) nx = 1;
      else if (distRight === minDist) nx = -1;
      else if (distTop === minDist) ny = 1;
      else ny = -1;
      const t = Math.max(
        0,
        Math.min(1, minDist / (edgeSoftZone + baseR * 0.4)),
      );
      rAlong = baseR * (1 - (1 - t) * edgeCompress);
      rAcross = baseR * (1 + (1 - t) * edgeSpread);
      angle = Math.atan2(ny, nx);
    } else if (speed < 0.6) {
      // 静止呼吸
      const breath = Math.sin(now * lensBreathSpeed) * lensBreathAmp;
      rAlong = baseR + breath;
      rAcross = baseR + breath;
      angle = 0;
    }

    if (rAlong > 0 && rAcross > 0) {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const pts: string[] = [];
      for (let i = 0; i < polygonPoints; i++) {
        const a = (i / polygonPoints) * Math.PI * 2;
        const lx = rAlong * Math.cos(a);
        const ly = rAcross * Math.sin(a);
        const x = position.x + lx * cosA - ly * sinA;
        const y = position.y + lx * sinA + ly * cosA;
        pts.push(`${x.toFixed(2)}px ${y.toFixed(2)}px`);
      }
      maskLayer.style.clipPath = `polygon(${pts.join(",")})`;
    }

    // 指针在内时持续 RAF（呼吸/边缘需要），离开时按位移收敛后停
    const stillMoving =
      isPointerInsideRef.current ||
      Math.abs(target.x - position.x) > 0.15 ||
      Math.abs(target.y - position.y) > 0.15 ||
      Math.abs(velocity.x) > 0.15 ||
      Math.abs(velocity.y) > 0.15 ||
      Math.abs(targetRadius - radiusRef.current) > 0.2 ||
      Math.abs(titleTarget.x - titleMotion.x) > 0.02 ||
      Math.abs(titleTarget.y - titleMotion.y) > 0.02 ||
      Math.abs(titleTarget.rotateX - titleMotion.rotateX) > 0.02 ||
      Math.abs(titleTarget.rotateY - titleMotion.rotateY) > 0.02 ||
      Math.abs(titleTarget.rotateZ - titleMotion.rotateZ) > 0.02;

    if (stillMoving) {
      animationRef.current = requestAnimationFrame(drawMotion);
    } else {
      if (!isPointerInsideRef.current) {
        maskLayer.style.clipPath = "none";
      }
      animationRef.current = null;
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (
      event.pointerType === "touch" ||
      !canFollowPointerRef.current ||
      reducedMotionRef.current
    ) {
      return;
    }

    const frame = frameRef.current;
    const maskLayer = maskLayerRef.current;
    if (!frame || !maskLayer) {
      return;
    }

    const bounds = frame.getBoundingClientRect();
    const pointerPoint = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    const targetRadius = getResponsiveOrbRadius(
      bounds.width,
      bounds.height,
    );
    const nextPoint = clampOrbTarget(
      pointerPoint,
      bounds.width,
      bounds.height,
      targetRadius,
    );
    const normalizedX = Math.max(
      -1,
      Math.min(1, (pointerPoint.x / bounds.width - 0.5) * 2),
    );
    const normalizedY = Math.max(
      -1,
      Math.min(1, (pointerPoint.y / bounds.height - 0.5) * 2),
    );

    if (!hasPointerPositionRef.current) {
      positionRef.current = { ...nextPoint };
      radiusRef.current = 0;
      velocityRef.current = { x: 0, y: 0 };
      hasPointerPositionRef.current = true;
    }

    frameSizeRef.current = { width: bounds.width, height: bounds.height };
    targetRef.current = nextPoint;
    targetRadiusRef.current = targetRadius;
    titleTargetRef.current = {
      x: normalizedX * 10,
      y: normalizedY * 8,
      rotateX: normalizedY * 8,
      rotateY: normalizedX * -11,
      rotateZ: normalizedX * -4.2,
    };
    isPointerInsideRef.current = true;
    maskLayer.style.opacity = "1";

    if (animationRef.current === null) {
      animationRef.current = requestAnimationFrame(drawMotion);
    }
  };

  const handlePointerLeave = () => {
    isPointerInsideRef.current = false;
    hasPointerPositionRef.current = false;
    titleTargetRef.current = { ...zeroTitleMotion };
    targetRadiusRef.current = 0;
    if (maskLayerRef.current) {
      maskLayerRef.current.style.opacity = "0";
    }

    if (animationRef.current === null) {
      animationRef.current = requestAnimationFrame(drawMotion);
    }
  };

  const toggleAbout = () => {
    setIsFlipped((current) => !current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleAbout();
    }
  };

  return {
    isFlipped,
    frameRef,
    frontFaceRef,
    maskLayerRef,
    toggleAbout,
    handleKeyDown,
    handlePointerMove,
    handlePointerLeave,
  };
}
