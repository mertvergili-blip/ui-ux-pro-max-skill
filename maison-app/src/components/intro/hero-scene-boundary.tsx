"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Three.js/WebGPU errors (unsupported adapter, driver quirks, shader
 * compile failures) can surface as render-time throws from react-three-fiber.
 * Without this boundary, a WebGPU failure takes down the whole intro screen
 * instead of just skipping the hero visual.
 */
export class HeroSceneBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
