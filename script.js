const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 640;

const content = document.getElementById('div_content');

const drawDebugDisplay = false;

const commonDoorWidth = 40;
const cameraTransitionTime = 1;

const levelImage = new Image();
levelImage.src = "level.png";

const keys = [];

function fade(element) {
    var op = 1;  // initial opacity
    var timer = setInterval(function () {
        if (op <= 0.1){
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.4;
    }, 50);
}

function unfade(element) {
    var op = 0.1;  // initial opacity
    element.style.display = 'block';
    var timer = setInterval(function () {
        if (op >= 1){
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.4;
    }, 10);
}

const CameraState = {
    Idle: 1,
    Moving: 2
};
Object.freeze(CameraState);

class Camera {
    constructor(xPos, yPos) {
        this.xPos = xPos;
        this.yPos = yPos;

        this.camState = CameraState.Idle;

        this.startX = 0;
        this.startY = 0;
        this.startTime = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.timeToReachTarget = 0;
    }

    update() {
        switch(this.camState) {
            case CameraState.Idle:
                break;
            case CameraState.Moving:
                this.updateMoveToTarget();
                break;
        }
    }

    moveTo(x, y, timeToReachTarget) {
        if(this.camState == CameraState.Idle) {
            
            if(timeToReachTarget < 0.1)
            {
                this.xPos = x;
                this.yPos = y;
                return;
            }
            
            //if(Math.abs(x - this.xPos) == 0)
            //{
            //    return;
            //}

            if(Math.abs(y - this.yPos) == 0)
            {
                return;
            }

            this.camState = CameraState.Moving;
            
            this.startX = this.xPos;
            this.startY = this.yPos;
            this.startTime = Date.now();

            this.targetX = x;
            this.targetY = y;

            this.timeToReachTarget = timeToReachTarget * 1000;
        }
    }

    updateMoveToTarget() {
        var timeElapsed = Date.now() - this.startTime;
        if(timeElapsed >= this.timeToReachTarget) {
            //this.xPos = this.startX = this.targetX;
            this.yPos = this.startY = this.targetY;
            this.camState = CameraState.Idle;
            
            if(levels.GetContentSide() == 0)
            {
                content.style.transform = "translate(-100%, -50%)";
            }
            else if(levels.GetContentSide() == 1)
            {
                content.style.transform = "translate(0%, -50%)";
            }

            content.innerText = levels.GetContent();
            
            if(levels.GetContentSide() != -1) {
                unfade(content);
            }
        }
        else {
            //const xDiff = this.targetX - this.startX;
            const yDiff = this.targetY - this.startY;

            const timeRatio = timeElapsed / this.timeToReachTarget;
            const multiplier = 3 * timeRatio * timeRatio - 2 * timeRatio * timeRatio * timeRatio;
            
            //this.xPos = this.startX + (xDiff * multiplier);
            this.yPos = this.startY + (yDiff * multiplier);
        }
    }
}
const camera = new Camera(0, 0);

class Levels {
    constructor() {
        this.sourceImage = new Image();
        this.sourceImage.src = "level.png";;

        this.levelsInfo = [
            {
                "xPos": 100,
                "yPos": 100,
                "width": 391,
                "height": 307,
                "sourceX": 0,
                "sourceY": 0,
                "localYRefPos": 140,
                "localAscendDoorXPos": -1,
                "localDescendDoorXPos": 286,
                "cameraPosY": 0,
                "contentSide": 1,
                "content": "Level1 - Content"
            },
            {
                "xPos": 800,
                "yPos": 700,
                "width": 391,
                "height": 307,
                "sourceX": 0,
                "sourceY": 320,
                "localYRefPos": 140,
                "localAscendDoorXPos": 30,
                "localDescendDoorXPos": 286,
                "cameraPosY": -500,
                "contentSide": 0,
                "content": "Level2 - Content"
            },
            {
                "xPos": 300,
                "yPos": 1300,
                "width": 680,
                "height": 307,
                "sourceX": 416,
                "sourceY": 0,
                "localYRefPos": 140,
                "localAscendDoorXPos": 30,
                "localDescendDoorXPos": -1,
                "cameraPosY": -1100,
                "contentSide": -1,
                "content": "This should not be visible!"
            }
        ]
        this.selectedLevelIndex = 0;
    }

    draw() {
        this.levelsInfo.forEach(level => {
            drawSprite(this.sourceImage, level.sourceX, level.sourceY, level.width, level.height, level.xPos, level.yPos, level.width, level.height);
            
            if(level.localAscendDoorXPos >= 0) {
                drawRectangle(level.xPos + level.localAscendDoorXPos, level.yPos, commonDoorWidth, 140, "red");
            }

            if(level.localDescendDoorXPos >= 0)
            drawRectangle(level.xPos + level.localDescendDoorXPos, level.yPos, commonDoorWidth, 140, "green");
        });
    }

    GetGlobalXLLimit() {
        return this.levelsInfo[this.selectedLevelIndex].xPos;
    }

    GetGlobalXRLimit() {
        return this.levelsInfo[this.selectedLevelIndex].width + this.levelsInfo[this.selectedLevelIndex].xPos;
    }

    GetGlobalYRefPos() {
        return this.levelsInfo[this.selectedLevelIndex].localYRefPos + this.levelsInfo[this.selectedLevelIndex].yPos;
    }

    GetContentSide() {
        return this.levelsInfo[this.selectedLevelIndex].contentSide;
    }

    GetContent() {
        return this.levelsInfo[this.selectedLevelIndex].content;
    }

    TryAscend(playerPosX) {

        if(this.selectedLevelIndex > 0
            && this.levelsInfo[this.selectedLevelIndex].localAscendDoorXPos >= 0) {
            
            const globalAscendDoorXPos = this.levelsInfo[this.selectedLevelIndex].xPos + this.levelsInfo[this.selectedLevelIndex].localAscendDoorXPos;

            if(playerPosX > globalAscendDoorXPos
                && playerPosX < globalAscendDoorXPos + commonDoorWidth) {
                this.selectedLevelIndex--;
                return true;
            }
        }

        return false;
    }

    TryDescend(playerPosX, playerTargetPosX) {

        if(this.selectedLevelIndex < this.levelsInfo.length - 1
            && this.levelsInfo[this.selectedLevelIndex].localDescendDoorXPos >= 0) {
            
            const globalDescendDoorXPos = this.levelsInfo[this.selectedLevelIndex].xPos + this.levelsInfo[this.selectedLevelIndex].localDescendDoorXPos;

            if(playerPosX > globalDescendDoorXPos
                && playerPosX < globalDescendDoorXPos + commonDoorWidth) {
                
                this.selectedLevelIndex++;

                playerTargetPosX = this.levelsInfo[this.selectedLevelIndex].xPos + this.levelsInfo[this.selectedLevelIndex].localAscendDoorXPos;

                return true;
            }
        }
        
        return false;
    }

    GetAscendDoorGlobalPosX() {
        if(this.levelsInfo[this.selectedLevelIndex].localAscendDoorXPos >= 0) {
            return this.levelsInfo[this.selectedLevelIndex].xPos + this.levelsInfo[this.selectedLevelIndex].localAscendDoorXPos;
        }

        return 0;
    }

    GetDescendDoorGlobalPosX() {
        if(this.levelsInfo[this.selectedLevelIndex].localDescendDoorXPos >= 0) {
            return this.levelsInfo[this.selectedLevelIndex].xPos + this.levelsInfo[this.selectedLevelIndex].localDescendDoorXPos;
        }

        return 0;
    }

    GetCameraPosY() {
        return this.levelsInfo[this.selectedLevelIndex].cameraPosY;
    }
}
const levels = new Levels();

const PlayerState = {
    Idle: 1,
    Moving: 2,

    AttackAnticipation: 3,
    Attack: 4,
    AttackFollowThrough: 5
}
Object.freeze(PlayerState);

const Facing = {
    Right: 1,
    Left: 2
}
Object.freeze(Facing);

class Player {
    constructor(x, y, w, h)
    {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.speed = 6;

        this.playerSprite = new Image();
        this.playerSprite.src = "char.png";

        this.playerState = PlayerState.Idle;
        this.playerFacing = Facing.Right;

        this.animationInfo = [
            {
                "name": "RightIdle",
                "sourceX": 32,
                "sourceY": 32,
                "noOfFrames": 5,
                "frameWidth": 64,
                "frameHeight": 32,
                "frameSpacing": 32,
                "drawOffsetX": 32,
                "drawOffsetY": 0,
                "looping": true
            },
            {
                "name": "LeftIdle",
                "sourceX": 32,
                "sourceY": 96,
                "noOfFrames": 5,
                "frameWidth": 64,
                "frameHeight": 32,
                "frameSpacing": 32,
                "drawOffsetX": 0,
                "drawOffsetY": 0,
                "looping": true
            },
            {
                "name": "RightAttackAnticipation",
                "sourceX": 32,
                "sourceY": 160,
                "noOfFrames": 3,
                "frameWidth": 96,
                "frameHeight": 64,
                "frameSpacing": 32,
                "drawOffsetX": 32,
                "drawOffsetY": 32,
                "looping": false
            },
            {
                "name": "RightAttack",
                "sourceX": 416,
                "sourceY": 160,
                "noOfFrames": 3,
                "frameWidth": 96,
                "frameHeight": 64,
                "frameSpacing": 32,
                "drawOffsetX": 32,
                "drawOffsetY": 32,
                "looping": false
            },
            {
                "name": "RightAttackFollowThrough",
                "sourceX": 672,
                "sourceY": 160,
                "noOfFrames": 4,
                "frameWidth": 96,
                "frameHeight": 64,
                "frameSpacing": 32,
                "drawOffsetX": 32,
                "drawOffsetY": 32,
                "looping": false
            },
            {
                "name": "LeftAttackAnticipation",
                "sourceX": 32,
                "sourceY": 256,
                "noOfFrames": 3,
                "frameWidth": 96,
                "frameHeight": 64,
                "frameSpacing": 32,
                "drawOffsetX": 32,
                "drawOffsetY": 32,
                "looping": false
            },
            {
                "name": "LeftAttack",
                "sourceX": 416,
                "sourceY": 256,
                "noOfFrames": 3,
                "frameWidth": 96,
                "frameHeight": 64,
                "frameSpacing": 32,
                "drawOffsetX": 32,
                "drawOffsetY": 32,
                "looping": false
            },
            {
                "name": "LeftAttackFollowThrough",
                "sourceX": 672,
                "sourceY": 256,
                "noOfFrames": 4,
                "frameWidth": 96,
                "frameHeight": 64,
                "frameSpacing": 32,
                "drawOffsetX": 32,
                "drawOffsetY": 32,
                "looping": false
            }
        ]

        this.activeAnimationIndex = 0;
        this.activeAnimationFrameIndex = 0;

    }

    GetAnimationInfoIndexOf(animationName) {
        
        var i = -1;
        
        switch(animationName) {
            case "RightIdle":
                i = 0;
                break;
            case "LeftIdle":
                i = 1;
                break;
            case "RightAttackAnticipation":
                i = 2
                break;
            case "RightAttack":
                i = 3;
                break;
            case "RightAttackFollowThrough":
                i = 4;
                break;
            case "LeftAttackAnticipation":
                i = 5;
                break;
            case "LeftAttack":
                i = 6;
                break;
            case "LeftAttackFollowThrough":
                i = 7;
                break;
        }

        return i;
    }

    SetActiveAnimation(animationName) {
        var i = this.GetAnimationInfoIndexOf(animationName);

        if(i >= 0) {
            this.activeAnimationIndex = i;
            this.activeAnimationFrameIndex = 0;
        }
    }

    ActiveAnimationComplete() {
        const activeAnimation = this.animationInfo[this.activeAnimationIndex];
        return !activeAnimation.looping && this.activeAnimationFrameIndex >= activeAnimation.noOfFrames - 1;
    }

    updateAnimation() {
        if(this.activeAnimationFrameIndex < this.animationInfo[this.activeAnimationIndex].noOfFrames - 1) {
            this.activeAnimationFrameIndex++;
        }
        else if(this.animationInfo[this.activeAnimationIndex].looping) {
            this.activeAnimationFrameIndex = 0;
        }
    }

    update(dt)
    {
        switch(this.playerState) {
            case PlayerState.AttackAnticipation:
                if(this.ActiveAnimationComplete()) {
                    this.playerState = PlayerState.Attacking;
                    
                    if(this.playerFacing == Facing.Right) {
                        this.SetActiveAnimation("RightAttack");
                        particleInstantiator.SpawnImpactParticles(this.x - (0.5 * this.w), this.y + this.h, 1, 4, -5, -4, -4, -1, 1, 4, 0.25, 0.25);
                    }
                    else {
                        this.SetActiveAnimation("LeftAttack");
                        particleInstantiator.SpawnImpactParticles(this.x + this.w, this.y + this.h, 1, 4, 4, 5, -4, -1, 1, 4, 0.25, 0.25);
                    }
                }
                else if(this.activeAnimationFrameIndex == 1) {
                    RequestCameraShakeThisFrame(1);
                }
                break;

            case PlayerState.Attacking:
                if(this.ActiveAnimationComplete()) {
                    this.playerState = PlayerState.AttackFollowThrough;
                    if(this.playerFacing == Facing.Right) {
                        this.SetActiveAnimation("RightAttackFollowThrough");
                        
                        particleInstantiator.SpawnImpactParticles(this.x + (0.8 * this.w), this.y + this.h, 1, 6, 4, 8, -5, -2, 4, 4, 0.2, 0.3);
                        particleInstantiator.SpawnImpactParticles(this.x + (0.8 * this.w), this.y + this.h, 0, 3, -2, 5, -1, 0, 2, 4, 1, 5);
                        particleInstantiator.SpawnFallingParticle(levels.GetGlobalXLLimit(), levels.GetGlobalXRLimit(), levels.GetGlobalYRefPos(), 0, 3);
                    }
                    else {
                        this.SetActiveAnimation("LeftAttackFollowThrough");

                        particleInstantiator.SpawnImpactParticles(this.x - (0.3 * this.w), this.y + this.h, 1, 6, -8, -4, -5, -2, 4, 4, 0.2, 0.3);
                        particleInstantiator.SpawnImpactParticles(this.x - (0.3 * this.w), this.y + this.h, 0, 3, -5, 2, 0, 1, 2, 4, 1, 5);
                        particleInstantiator.SpawnFallingParticle(levels.GetGlobalXLLimit(), levels.GetGlobalXRLimit(), levels.GetGlobalYRefPos(), 0, 3);
                    }
    
                }
                else if(this.activeAnimationFrameIndex == 1) {
                    RequestCameraShakeThisFrame(6);
                }
                break;

            case PlayerState.AttackFollowThrough:
                if(this.ActiveAnimationComplete()) {
                    this.playerState = PlayerState.Idle;
                    if(this.playerFacing == Facing.Right) {
                        this.SetActiveAnimation("RightIdle");
                    }
                    else {
                        this.SetActiveAnimation("LeftIdle");
                    }
                }
                break;

            case PlayerState.Idle:
                break;

            case PlayerState.Moving:
                if(this.playerFacing == Facing.Right) {
                    if(this.x < (levels.GetGlobalXRLimit() - this.w / 2)) {
                        this.x += this.speed;
                    }
                }
                else {
                    if(this.x > levels.GetGlobalXLLimit()) {
                        this.x -= this.speed;
                    }
                }
                break;
        }
    }

    TryToInteract() {

        if(this.playerState == PlayerState.Idle || this.playerState == PlayerState.Moving) {

            if(levels.TryDescend(this.x)) {
                fade(content);
                camera.moveTo(0, levels.GetCameraPosY(), cameraTransitionTime);
                this.x = levels.GetAscendDoorGlobalPosX() + commonDoorWidth / 4;
                this.y = levels.GetGlobalYRefPos() - this.h;
                this.playerState = PlayerState.Idle;

                return true;
            }

            else if(levels.TryAscend(this.x)) {
                fade(content);
                camera.moveTo(0, levels.GetCameraPosY(), cameraTransitionTime);
                this.x = levels.GetDescendDoorGlobalPosX() + commonDoorWidth / 4;
                this.y = levels.GetGlobalYRefPos() - this.h;
                this.playerState = PlayerState.Idle;

                return true;
            }
        }

        return false;
    }

    TryToAttack() {

        if(this.playerState == PlayerState.Idle || this.playerState == PlayerState.Moving) {
            this.playerState = PlayerState.AttackAnticipation;

            if(this.playerFacing == Facing.Right) {
                this.SetActiveAnimation("RightAttackAnticipation");
            }
            else {
                this.SetActiveAnimation("LeftAttackAnticipation");
            }

            return true;
        }

        return false;
    }

    TryToAttackRight() {
        if(this.playerState == PlayerState.Idle || this.playerState == PlayerState.Moving) {
            this.playerState = PlayerState.AttackAnticipation;
            this.playerFacing = Facing.Right;
            this.SetActiveAnimation("RightAttackAnticipation");

            return true;
        }

        return false;
    }

    TryToAttackLeft() {
        if(this.playerState == PlayerState.Idle || this.playerState == PlayerState.Moving) {
            this.playerState = PlayerState.AttackAnticipation;
            this.playerFacing = Facing.Left;
            this.SetActiveAnimation("LeftAttackAnticipation");

            return true;
        }

        return false;
    }

    TryToMoveRight() {
        if(this.playerState == PlayerState.Idle) {
            this.playerState = PlayerState.Moving;
            this.playerFacing = Facing.Right;
            this.SetActiveAnimation("RightIdle");

            return true;
        }
        else if(this.playerState == PlayerState.Moving && this.playerFacing != Facing.Right) {
            this.playerFacing = Facing.Right;
            this.SetActiveAnimation("RightIdle");

            return true;
        }

        return false;
    }

    TryToMoveLeft() {
        if(this.playerState == PlayerState.Idle) {
            this.playerState = PlayerState.Moving;
            this.playerFacing = Facing.Left;
            this.SetActiveAnimation("LeftIdle");

            return true;
        }
        else if(this.playerState == PlayerState.Moving && this.playerFacing != Facing.Left) {
            this.playerFacing = Facing.Left;
            this.SetActiveAnimation("LeftIdle");

            return true;
        }

        return false;
    }

    TryToIdle() {
        if(this.playerState == PlayerState.Moving) {
            this.playerState = PlayerState.Idle;

            return true;
        }

        return false;
    }

    draw() {
        const activeAnimation = this.animationInfo[this.activeAnimationIndex];
        const srcX = activeAnimation.sourceX + (this.activeAnimationFrameIndex * (activeAnimation.frameWidth + activeAnimation.frameSpacing));

        const drawX = this.x - activeAnimation.drawOffsetX;
        const drawY = this.y - activeAnimation.drawOffsetY;

        drawSprite(this.playerSprite, srcX, activeAnimation.sourceY, activeAnimation.frameWidth, activeAnimation.frameHeight, drawX, drawY, activeAnimation.frameWidth, activeAnimation.frameHeight);

        drawRectangle(this.x, this.y, this.w, this.h, "blue");
    }
}
let player = new Player(280, levels.GetGlobalYRefPos() - 32, 64, 32);

class InputHandler {
    constructor() {}

    update() {

        if(camera.camState != CameraState.Idle) {
            return;
        }

        if(keys['w']) {
            if(player.TryToInteract()) {
                return;
            }
        }

        if((keys['a'] && !keys['d']) || (!keys['a'] && keys['d'])) {
            if(keys['a']) {
                if(keys[' '] && player.TryToAttackLeft()) {
                    return;
                }
                else if(player.TryToMoveLeft()){
                    return;
                }
            }
            else if(keys['d']) {
                if(keys[' '] && player.TryToAttackRight()) {
                    return;
                }
                else if(player.TryToMoveRight()){
                    return;
                }
            }
        }
        else {
            if(keys[' '] && player.TryToAttack()) {
                return;
            }
            else if(player.TryToIdle()) {
                return;
            }
        }
        
    }
}
let inputHandler = new InputHandler();

const ParticleType = {
    Dust: 0,
    Debris: 1,
    DebrisPiece: 2
}
Object.freeze(ParticleType);

class Particle {
    constructor(xPos, yPos, xVel, yVel, size, life, particleType) {
        this.xPos = xPos;
        this.yPos = yPos;

        this.initialSize = this.curSize = size;

        if(particleType != ParticleType.Debris) {
            this.life = this.remLife = life * 1000;
        }
        else {
            this.life = this.remLife = life;
        }

        this.xVel = xVel;
        this.yVel = yVel;

        this.particleType = particleType;
    }
}

class ParticleManager {
    constructor() {
        this.particles = [];
    }

    AddParticle(xPos, yPos, xVel, yVel, size, life, particleType) {
        var particle = new Particle(xPos, yPos, xVel, yVel, size, life, particleType);
        this.particles.push(particle);
    }

    update(dt) {
        this.particles.forEach(function(particle, index, objectArray) {
            
            switch(particle.particleType) {
                case ParticleType.Dust:
                    if(particle.remLife <= 0) {
                        objectArray.splice(index, 1);
                    }
                    else {
                        particle.remLife -= dt;
                        if(particle.remLife < 0) {
                            particle.remLife = 0;
                        }

                        particle.yVel += 9.8 * dt / 1000;
                        particle.yPos += particle.yVel;

                        particle.xVel *= 0.9;
                        particle.xPos += particle.xVel;

                        const ratio = 1 - particle.remLife / particle.life;
                        particle.curSize = Math.ceil(particle.initialSize * (1 - ratio*ratio));
                    }
                    break;

                case ParticleType.DebrisPiece:
                    if(particle.remLife <= 0) {
                        objectArray.splice(index, 1);
                    }
                    else {
                        particle.remLife -= dt;
                        if(particle.remLife < 0) {
                            particle.remLife = 0;
                        }

                        particle.yVel += 9.8 * dt / 1000;
                        particle.yPos += particle.yVel;

                        particle.xVel *= 0.99;
                        particle.xPos += particle.xVel;

                        const ratio = 1 - particle.remLife / particle.life;
                        particle.curSize = Math.ceil(particle.initialSize * (1 - ratio*ratio));
                    }
                    break;

                case ParticleType.Debris:
                    if(particle.yPos < particle.life) {
                        particle.yVel += 9.8 * dt / 1000;
                        particle.yPos += particle.yVel;

                        particle.xVel *= 0.9;
                        particle.xPos += particle.xVel;
                    }

                    if(particle.yPos >= particle.life) {
                        var newParticle = new Particle(particle.xPos, particle.life, -1, -4, 3, 5, ParticleType.DebrisPiece);
                        objectArray.push(newParticle);
                        var newParticle = new Particle(particle.xPos, particle.life, 0, -5, 3, 5, ParticleType.DebrisPiece);
                        objectArray.push(newParticle);
                        var newParticle = new Particle(particle.xPos, particle.life, 2, -3, 3, 5, ParticleType.DebrisPiece);
                        objectArray.push(newParticle);
                        
                        objectArray.splice(index, 1);
                    }
                    
                    break;
            }
        });
    }

    draw() {
        this.particles.forEach(particle => {
            
            const drawX = particle.xPos + camera.xPos;
            const drawY = particle.yPos + camera.yPos;
            
            if(drawY > -drawBorder
                && drawY < canvas.height + drawBorder
                && drawX > - drawBorder
                && drawX < canvas.width + drawBorder) {
                
                switch(particle.particleType) {
                    case ParticleType.Dust:
                    case ParticleType.Debris:
                    case ParticleType.DebrisPiece:
                        ctx.fillStyle = "#f6cacd";
                        break;
                }

                ctx.fillRect(drawX, drawY, particle.curSize, particle.curSize);
            }
        });
    }
}
let particleManager = new ParticleManager();

const overlayImage = new Image();
overlayImage.src = "overlay.png";

class ParticleInstantiator {
    constructor() {

    }

    SpawnImpactParticles(x, y, noOfParticlesRandRangeMin, noOfParticlesRandRangeMax, xVelRandRangeMin, xVelRandRangeMax, yVelRandRangeMin, yVelRandRangeMax, sizeRandRangeMin, sizeRandRangeMax, lifeRandRangeMin, lifeRandRangeMax) {
        var noOfParticles = Math.ceil(Math.random() * (noOfParticlesRandRangeMax - noOfParticlesRandRangeMin) + noOfParticlesRandRangeMin);
        while(noOfParticles > 0) {
            const xVel = Math.random() * (xVelRandRangeMax - xVelRandRangeMin) + xVelRandRangeMin;
            const yVel = Math.random() * (yVelRandRangeMax - yVelRandRangeMin) + yVelRandRangeMin;
            const size = Math.random() * (sizeRandRangeMax - sizeRandRangeMin) + sizeRandRangeMin;
            const life = Math.random() * (lifeRandRangeMax - lifeRandRangeMin) + lifeRandRangeMin;

            particleManager.AddParticle(x, y, xVel, yVel, size, life, ParticleType.Dust);
            noOfParticles--;
        }
    }

    SpawnFallingParticle(xMin, xMax, yGround, noOfParticlesRandRangeMin, noOfParticlesRandRangeMax) {
        var noOfParticles = Math.ceil(Math.random() * (noOfParticlesRandRangeMax - noOfParticlesRandRangeMin) + noOfParticlesRandRangeMin);
        while(noOfParticles > 0) {
            const size = 5;
            
            const xMaxActual = xMax - size;
            const yGroundActual = yGround - size;
            
            const x = Math.random() * (xMaxActual - xMin) + xMin;
            const y = -camera.yPos + noOfParticles * (-40);

            particleManager.AddParticle(x, y, 0, 0, size, yGroundActual, ParticleType.Debris);
            noOfParticles--;
        }
    }
}
let particleInstantiator = new ParticleInstantiator();

const drawBorder = 32;
function drawSprite(img, sX, sY, sW, sH, dX, dY, dW, dH) {

    const drawX = dX + camera.xPos;
    const drawY = dY + camera.yPos;

    if((drawY > -dH - drawBorder)
        && (drawY < canvas.height + drawBorder)
        && (drawX > -dW - drawBorder)
        && (drawX < canvas.width + drawBorder)) {
        
        ctx.drawImage(img, sX, sY, sW, sH, drawX, drawY, dW, dH); // Only draw the sprite if it is in frame with a 32 pixel border.
    }
}

function drawRectangle(x, y, w, h, colour) {
    if(!drawDebugDisplay) {
        return;
    }

    ctx.beginPath();
    ctx.lineWidth = "2";
    ctx.strokeStyle = colour;
    ctx.rect(x + camera.xPos, y + camera.yPos, w, h);
    ctx.stroke();
}

window.addEventListener("keydown", function(e){
    keys[e.key] = true;
});

window.addEventListener("keyup", function(e){
    delete keys[e.key];
});

var shakeCameraThisFrame = false;
var shakeCameraMagnitude = 0;

function RequestCameraShakeThisFrame(magnitude) {
    if(magnitude > shakeCameraMagnitude) {
        shakeCameraMagnitude = magnitude;
        shakeCameraThisFrame = true;
    }
}

function preShake() {
    if(shakeCameraThisFrame) {
        ctx.save();
        const dx = (2 * Math.random() - 1) * shakeCameraMagnitude;
        const dy = (2 * Math.random() - 1) * shakeCameraMagnitude;
        ctx.translate(dx, dy);
    }
}

function postShake() {
    if(shakeCameraThisFrame) {
        ctx.restore();
        shakeCameraThisFrame = false;
        shakeCameraMagnitude = 0;
    }
}

let gameplayFPSInterval, gameplayNow, gameplayThen, gameplayElapsed;
let animationFPSInterval, animationNow, animationThen, animationElapsed;

function startGameLoop(gameplayFPS, animationFPS) {
    gameplayFPSInterval = 1000/gameplayFPS;
    animationFPSInterval = 1000/animationFPS;

    gameplayThen = animationThen = Date.now();

    content.innerText = levels.GetContent();

    gameLoop();
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    
    gameplayNow = animationNow = Date.now();
    gameplayElapsed = gameplayNow - gameplayThen;
    animationElapsed = animationNow - animationThen;

    if(gameplayElapsed > gameplayFPSInterval) {
        gameplayThen = gameplayNow - (gameplayElapsed % gameplayFPSInterval);

        // Gameplay updates
        camera.update();
        inputHandler.update();
        player.update(gameplayElapsed);
        particleManager.update(gameplayElapsed);

        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        preShake()

        levels.draw();
        player.draw();
        particleManager.draw();

        postShake();

        ctx.drawImage(overlayImage, 0, 0);
    }
    
    if(animationElapsed > animationFPSInterval) {
        animationThen = animationNow - (animationElapsed % animationFPSInterval);

        // Animation updates
        player.updateAnimation();
    }
}

startGameLoop(60, 10);