declare namespace Desmos {
  interface CalculatorOptions {
    expressions?: boolean;
    expressionsCollapsed?: boolean;
    settingsMenu?: boolean;
    zoomButtons?: boolean;
    lockViewport?: boolean;
    border?: boolean;
    keypad?: boolean;
    expressionsTopbar?: boolean;
    backgroundColor?: string;
    defaultExpression?: boolean;
    administerSecretFolders?: boolean;
    images?: boolean;
    folders?: boolean;
    notes?: boolean;
    sliders?: boolean;
    links?: boolean;
    showGrid?: boolean;
    showXAxis?: boolean;
    showYAxis?: boolean;
    xAxisNumbers?: boolean;
    yAxisNumbers?: boolean;
    polarNumbers?: boolean;
    restrictGridToFirstQuadrant?: boolean;
    restrictedFunctions?: boolean;
    trace?: boolean;
    points?: boolean;
    lines?: boolean;
    fill?: boolean;
    fontSize?: number;
    expressionsWidth?: number;
    language?: string;
    gridOpacity?: number;
    textColor?: string;
    labelSize?: number;
    projectorMode?: boolean;
    authorFeatures?: boolean;
    plotSingleVariableImplicitEquations?: boolean;
    plotImplicits?: boolean;
    plotInequalities?: boolean;
    colors?: boolean;
  }

  interface Expression {
    id: string;
    latex: string;
    color?: string;
    hidden?: boolean;
  }

  interface Calculator {
    setExpression(expr: Expression): void;
    removeExpressions(): void;
    destroy(): void;
  }

  function GraphingCalculator(
    element: HTMLElement,
    options?: CalculatorOptions
  ): Calculator;
} 