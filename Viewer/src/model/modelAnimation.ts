import { AnimationGroup, Animatable, Skeleton } from "babylonjs";

export enum AnimationPlayMode {
    ONCE,
    LOOP
}

export enum AnimationState {
    INIT,
    PLAYING,
    PAUSED,
    STOPPED,
    ENDED
}

export interface IModelAnimation {
    readonly state: AnimationState;
    readonly name: string;
    readonly frames: number;
    readonly currentFrame: number;
    readonly fps: number;
    speedRatio: number;
    playMode: AnimationPlayMode;
    start();
    stop();
    pause();
    reset();
    restart();
    goToFrame(frameNumber: number);
    dispose();
}

export class GroupModelAnimation implements IModelAnimation {

    private _playMode: AnimationPlayMode;
    private _state: AnimationState;

    constructor(private _animationGroup: AnimationGroup) {
        this._state = AnimationState.INIT;
        this._playMode = AnimationPlayMode.LOOP;

        this._animationGroup.onAnimationEndObservable.add(() => {
            this.stop();
            this._state = AnimationState.ENDED;
        })
    }

    public get name() {
        return this._animationGroup.name;
    }

    public get state() {
        return this._state;
    }

    /**
     * Gets or sets the speed ratio to use for all animations
     */
    public get speedRatio(): number {
        return this._animationGroup.speedRatio;
    }

    /**
     * Gets or sets the speed ratio to use for all animations
     */
    public set speedRatio(value: number) {
        this._animationGroup.speedRatio = value;
    }

    public get frames(): number {
        let animationFrames = this._animationGroup.targetedAnimations.map(ta => {
            let keys = ta.animation.getKeys();
            return keys[keys.length - 1].frame;
        });
        return Math.max.apply(null, animationFrames);
    }

    public get currentFrame(): number {
        // get the first currentFrame found
        for (let i = 0; i < this._animationGroup.animatables.length; ++i) {
            let animatable: Animatable = this._animationGroup.animatables[i];
            let animations = animatable.getAnimations();
            if (!animations || !animations.length) {
                continue;
            }
            for (let idx = 0; idx < animations.length; ++idx) {
                if (animations[idx].currentFrame) {
                    return animations[idx].currentFrame;
                }
            }
        }
        return 0;
    }

    public get fps(): number {
        // get the first currentFrame found
        for (let i = 0; i < this._animationGroup.animatables.length; ++i) {
            let animatable: Animatable = this._animationGroup.animatables[i];
            let animations = animatable.getAnimations();
            if (!animations || !animations.length) {
                continue;
            }
            for (let idx = 0; idx < animations.length; ++idx) {
                if (animations[idx].animation && animations[idx].animation.framePerSecond) {
                    return animations[idx].animation.framePerSecond;
                }
            }
        }
        return 0;
    }

    public get playMode(): AnimationPlayMode {
        return this._playMode;
    }

    public set playMode(value: AnimationPlayMode) {
        if (value === this._playMode) {
            return;
        }

        this._playMode = value;

        if (this.state === AnimationState.PLAYING) {
            this._animationGroup.play(this._playMode === AnimationPlayMode.LOOP);
        } else {
            this._animationGroup.reset();
            this._state = AnimationState.INIT;
        }
    }

    reset() {
        this._animationGroup.reset();
    }

    restart() {
        this._animationGroup.restart();
    }

    goToFrame(frameNumber: number) {
        // this._animationGroup.goToFrame(frameNumber);
        this._animationGroup['_animatables'].forEach(a => {
            a.goToFrame(frameNumber);
        })
    }

    public start() {
        this._animationGroup.start(this.playMode === AnimationPlayMode.LOOP, this.speedRatio);
        if (this._animationGroup.isStarted) {
            this._state = AnimationState.PLAYING;
        }
    }

    pause() {
        this._animationGroup.pause();
        this._state = AnimationState.PAUSED;
    }

    public stop() {
        this._animationGroup.stop();
        if (!this._animationGroup.isStarted) {
            this._state = AnimationState.STOPPED;
        }
    }

    public dispose() {
        this._animationGroup.dispose();
    }
}