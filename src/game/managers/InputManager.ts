// =============================================
// InputManager — Keyboard + Mouse input handler
// =============================================

export class InputManager {
  private static instance: InputManager | null = null;
  
  // Keyboard state
  private keysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  
  // Mouse state
  public mouseX = 0;
  public mouseY = 0;
  public hasMouseMoved = false;
  public mouseDown = false;
  public rightMouseDown = false;
  
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;

  private constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  public init(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('mouseup', this.boundMouseUp);
    InputManager.instance = null;
  }

  // Called once per frame after processing
  public endFrame(): void {
    this.keysJustPressed.clear();
  }

  // --- Query API ---
  public isKeyDown(key: string): boolean {
    return this.keysDown.has(key.toLowerCase());
  }

  public isKeyJustPressed(key: string): boolean {
    return this.keysJustPressed.has(key.toLowerCase());
  }

  // Movement helpers
  public get moveX(): number {
    let x = 0;
    if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) x -= 1;
    if (this.isKeyDown('d') || this.isKeyDown('arrowright')) x += 1;
    return x;
  }

  public get moveY(): number {
    let y = 0;
    if (this.isKeyDown('w') || this.isKeyDown('arrowup')) y -= 1;
    if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) y += 1;
    return y;
  }

  // --- Event Handlers ---
  private onKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (!this.keysDown.has(key)) {
      this.keysJustPressed.add(key);
    }
    this.keysDown.add(key);
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.key.toLowerCase());
  }

  private onMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.hasMouseMoved = true;
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0) this.mouseDown = true;
    if (e.button === 2) this.rightMouseDown = true;
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 0) this.mouseDown = false;
    if (e.button === 2) this.rightMouseDown = false;
  }
}
