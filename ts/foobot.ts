declare function newInterpreter(a:any,b:any): any;

class Robot extends Phaser.GameObjects.Container {
    scene: Scene1;
    static instance: Robot;

  moving: boolean; //prevents further steps in code until animation is complete
  myInterpreter: any;
  onComplete: any;
  
  static ease = 'Cubic.easeInOut';
  static duration = 1000;
  static lookingX = [1,0,-1,0];
  static lookingY = [0,1,0,-1];
  static lookingBodyFrames = [["RightRaised","DownRaised","LeftRaised","UpRaised"],
                              ["RightLowered","DownLowered","LeftLowered","UpLowered"]];
  static raiseAndLowerDistance = 32; //distance moved towards fruit before picking it up 
  static carryingHeight = 32; //distance moved towards fruit before picking it up 
  
  lookingIndex: number = 0; //0 = right, 1 = down, 2 = left, 3 = up //getter and setter
  isScoopDown: boolean = true;
  carryingFruit: Phaser.GameObjects.Sprite;

  body: Phaser.GameObjects.Sprite;
  //getter and setter for carrying sprite

    constructor(scene: Scene1,x,y) {
      super(scene,x,y,[]);
      scene.add.existing(this);
      this.body = new Phaser.GameObjects.Sprite(scene, 0, 0, "body", "RightLowered"); 
      this.add(this.body);
      
      this.setDepth(10);
    }

    ahead(onComplete) {
      if (this.isLookingOutOfBounds) {
        if (onComplete) onComplete();
        return;
      }
      this.scene.tweens.add({
        targets: this,
        x: this.x + Robot.lookingX[this.lookingIndex]* TILE_SIZE,
        y: this.y + Robot.lookingY[this.lookingIndex]* TILE_SIZE,
        duration: Robot.duration, ease: Robot.ease, repeat: 0, yoyo: false, paused: false, onComplete: onComplete,
      });
      //this.rollWheels(this.lookingIndex == 0);
    }

    back(onComplete) {
      if (this.isLookingOutOfBounds) {
        if (onComplete) onComplete();
        return;
      }
      this.scene.tweens.add({
        targets: this,
        x: this.x - Robot.lookingX[this.lookingIndex]* TILE_SIZE,
        y: this.y - Robot.lookingY[this.lookingIndex]*TILE_SIZE ,
        duration: Robot.duration, ease: Robot.ease, repeat: 0, yoyo: false, paused: false, onComplete: onComplete,
      });
      //this.rollWheels(this.lookingIndex != 0);
    }

    right(onComplete) {
      //play animation
      this.lookingIndex = (this.lookingIndex+1)%4;
      this.refreshFrame();
      setTimeout(onComplete,Robot.duration/2);
    }        

    left(onComplete) {
      //play animation
      this.lookingIndex = (this.lookingIndex+3)%4;
      this.refreshFrame();
      setTimeout(onComplete,Robot.duration/2);
    }

    peek(onComplete) {
      //play animation
      let fruit = this.getLookingFruit();
      setTimeout(onComplete,Robot.duration/2);
      if (fruit) return this.scene.getFruitCode(fruit);
      return null;
    }

    raise(onComplete) {
      if (!this.isScoopDown) {
        if (onComplete) onComplete(); 
        return;
      }

      //move towards fruit
      let moveTowardsTween = this.scene.tweens.create(
        {
          targets: this,
          x: {from: this.x, to: this.x + (this.isSideView ? Robot.lookingX[this.lookingIndex] * Robot.raiseAndLowerDistance : 0)},
          y: {from: this.y, to: this.y + (this.isSideView ? 0 : Robot.lookingY[this.lookingIndex] * Robot.raiseAndLowerDistance)},
          duration: Robot.duration/2, ease: Robot.ease, repeat: 0, yoyo: false, paused: false
        });

      let liftScoopInjector = function(paramOnCompleteTween,robot,fruit) {
        var paramOnCompleteTween = paramOnCompleteTween;
        var robot = robot;
        //lift scoop
        return () => {
          robot.isScoopDown = false;
          robot.refreshFrame();
          if (fruit) { 
            //pick it up
            robot.add(fruit);
            robot.scene.food.remove(fruit);
            fruit.setPosition(0,-Robot.carryingHeight);
          }
          if (paramOnCompleteTween) paramOnCompleteTween.play();
        }
      };

      //move away from fruit
      let moveAwayTween = this.scene.tweens.create({
          targets: this,
          x: {to: this.x, from: this.x + (this.isSideView ? Robot.lookingX[this.lookingIndex] * Robot.raiseAndLowerDistance : 0)},
          y: {to: this.y, from: this.y + (this.isSideView ? 0 : Robot.lookingY[this.lookingIndex] * Robot.raiseAndLowerDistance)},
          duration: Robot.duration/2, ease: Robot.ease, repeat: 0, yoyo: false, paused: false
        });

        let fruit = this.getLookingFruit();
        this.carryingFruit = fruit;
      if (onComplete) moveAwayTween.on("complete",onComplete);
      moveTowardsTween.on("complete",liftScoopInjector(moveAwayTween,this,fruit));
      moveTowardsTween.play();
    }

    lower(onComplete) {
      if (this.isScoopDown) {
        if (onComplete) onComplete();
        return;
      }

      //move towards fruit
      let moveTowardsTween = this.scene.tweens.create(
        {
          targets: this,
          x: {from: this.x, to: this.x + (this.isSideView ? Robot.lookingX[this.lookingIndex] * Robot.raiseAndLowerDistance : 0)},
          y: {from: this.y, to: this.y + (this.isSideView ? 0 : Robot.lookingY[this.lookingIndex] * Robot.raiseAndLowerDistance)},
          duration: Robot.duration/2, ease: Robot.ease, repeat: 0, yoyo: false, paused: false
        });


        let liftScoopInjector = function(paramOnCompleteTween,robot,fruit) {
          var paramOnCompleteTween = paramOnCompleteTween;
          var robot = robot;
          //lift scoop
          return () => {
            robot.isScoopDown = true;
            robot.refreshFrame();

            if (fruit) { 
              //pick it up
              let endFruitX = Robot.lookingX[robot.lookingIndex] * (TILE_SIZE - Robot.raiseAndLowerDistance);
              let endFruitY = Robot.lookingY[robot.lookingIndex] * (TILE_SIZE - Robot.raiseAndLowerDistance);
              robot.remove(fruit);
              fruit.setPosition(robot.x + endFruitX,robot.y + endFruitY);
              robot.scene.add.existing(fruit);
              robot.scene.food.add(fruit);
            }
            if (paramOnCompleteTween) paramOnCompleteTween.play();
          }
        };
  

        //move away from fruit
        let moveAwayTween = this.scene.tweens.create({
          targets: this,
          x: {to: this.x, from: this.x + (this.isSideView ? Robot.lookingX[this.lookingIndex] * Robot.raiseAndLowerDistance : 0)},
          y: {to: this.y, from: this.y + (this.isSideView ? 0 : Robot.lookingY[this.lookingIndex] * Robot.raiseAndLowerDistance)},
          duration: Robot.duration/2, ease: Robot.ease, repeat: 0, yoyo: false, paused: false
        });


      let fruit = this.carryingFruit;
      this.carryingFruit = null;
      if (onComplete) moveAwayTween.on("complete",onComplete);
      moveTowardsTween.on("complete",liftScoopInjector(moveAwayTween,this,fruit));
      moveTowardsTween.play();
    }

    get mapCoords(): number[] {return this.scene.getMapCoords(this.x, this.y)};
    get lookingMapCoords() {
      let [i,j] = this.mapCoords;
      return [i + Robot.lookingX[this.lookingIndex], j + Robot.lookingY[this.lookingIndex]];
    }
    get lookingPosition() {
      return [this.x + Robot.lookingX[this.lookingIndex]*TILE_SIZE, this.y + Robot.lookingY[this.lookingIndex]*TILE_SIZE];
    }
    get isLookingRight() { return this.lookingIndex == 0}
    get isSideView() { return this.lookingIndex == 0 || this.lookingIndex == 2}
    get isLookingDown() { return this.lookingIndex == 1 }
    get isLookingOutOfBounds() {
      let [i,j] = this.lookingMapCoords;
      return i < 0 || i > this.scene.maxI || j < 0 || j > this.scene.maxJ;
    }

    getLookingFruit(): Phaser.GameObjects.Sprite {
      let lookingCoords = this.lookingPosition;
      for (let fruit of (this.scene.food.getChildren() as Phaser.GameObjects.Sprite[])) {
        if (fruit.x==lookingCoords[0] && fruit.y==lookingCoords[1]) {
          return (fruit);
        }
      };
    }

    refreshFrame() {
      this.body.setFrame(Robot.lookingBodyFrames[this.isScoopDown ? 1 : 0][this.lookingIndex]);
      //this.sideViewableWheels.forEach(w => w.setVisible(this.isSideView));
    }

    runCode(myCode, onComplete) {
      var robot = this;
      var initFunc =  (interpreter, globalObject) => {
        var aheadWrapper = function() {
            robot.moving = true;
            robot.ahead(() => { robot.moving = false; robot.nextStep();});
        };
        interpreter.setProperty(globalObject, 'ahead', interpreter.createNativeFunction(aheadWrapper));

        var backWrapper = function() {
          robot.moving = true;
          robot.back(() => { robot.moving = false; robot.nextStep();});
        };
        interpreter.setProperty(globalObject, 'back', interpreter.createNativeFunction(backWrapper));

        var leftWrapper = function() {
          robot.moving = true;
          robot.left(() => { robot.moving = false; robot.nextStep();});
        };
        interpreter.setProperty(globalObject, 'left', interpreter.createNativeFunction(leftWrapper));

        var rightWrapper = function() {
          robot.moving = true;
          robot.right(() => { robot.moving = false; robot.nextStep();});
        };
        interpreter.setProperty(globalObject, 'right', interpreter.createNativeFunction(rightWrapper));

        var leftWrapper = function() {
          robot.moving = true;
          robot.left(() => { robot.moving = false; robot.nextStep();});
        };
        interpreter.setProperty(globalObject, 'left', interpreter.createNativeFunction(leftWrapper));

        var raiseWrapper = function() {
          robot.moving = true;
          robot.raise(() => { robot.moving = false; robot.nextStep();});
        };
        interpreter.setProperty(globalObject, 'raise', interpreter.createNativeFunction(raiseWrapper));

        var lowerWrapper = function() {
          robot.moving = true;
          robot.lower(() => { robot.moving = false; robot.nextStep();});
        };
        interpreter.setProperty(globalObject, 'lower', interpreter.createNativeFunction(lowerWrapper));

        var peekWrapper = function() {
          robot.moving = true;
          return robot.peek(() => { robot.moving = false; robot.nextStep();});
        };
        interpreter.setProperty(globalObject, 'peek', interpreter.createNativeFunction(peekWrapper));

        var logWrapper = function(str) {
          console.log(str);
        };
        interpreter.setProperty(globalObject, 'log', interpreter.createNativeFunction(logWrapper));

    };
      this.myInterpreter = newInterpreter(myCode, initFunc);
      this.nextStep();
      this.onComplete = onComplete;
    }

    nextStep() {
      while (!this.moving && this.myInterpreter.step()) {
        //nothing between non moving steps
      };
      if (!this.moving && this.onComplete) {
        this.onComplete();
      }
    }

    /*rollWheels(isForwards: boolean) {
      this.scene.tweens.add({
        targets: this.sideViewableWheels,
        angle: {from: 0, to: isForwards ? 360 : -360},
        duration: Robot.duration, ease: Robot.ease, repeat: 0, yoyo: false, paused: false,
      });
    }*/
}

const MAP_ROW_DELIMITER= ":";
const MAP_COL_DELIMITER = ",";
const TILE_SIZE = 64;
const TILE_OFFSET = 64;
const FOOD_SCALE = 0.75;
const floorMapTextureCodes = {
  "_": ["sprite1","sprite2","sprite3","sprite4"]
}
const foodMapTextureCodes = {
  "b": "banana"
}

class Scene1 extends Phaser.Scene {

  static instance: Scene1;
  floors: Phaser.GameObjects.Group;
  player: Robot;
  busy: boolean;
  levelMap: any;
  food: Phaser.GameObjects.Group;


  constructor(levelMap) {
      super({
          key: 'sceneA',
          active: true,
          physics:
          {
              default: 'arcade',
              arcade:
                  {
                      debug: false,
                  }
          },
      });
      Scene1.instance = this;
      this.levelMap = levelMap;
  }

  preload() {
    if (document.getElementById("base")) this.load.setBaseURL((document.getElementById("base") as any).href);
    
    this.load.image("bg","images/BG.png");
    this.load.atlas("body", "images/foobotSpriteSheet.png", "images/foobotSpriteSheet.json");
    this.load.atlas("food", "images/foodSpriteSheet64.png", "images/foodSpriteSheet64.json");
    this.load.atlas("floor", "images/floorSpriteSheet.png", "images/floorSpriteSheet.json");
  }

  create() {
      this.player = new Robot(this, 100, 100);
      this.floors = this.physics.add.staticGroup();
      this.food = this.physics.add.group();
      
      this.add.image(352,352,"bg").setDepth(-200);
    
      this.resetMap();

      //this.player.setCollideWorldBounds(true);
  }

  resetMap() {
      
    //remove old sprites
    this.floors.clear(true,true);
    this.food.clear(true,true);
  
    //c = crate
    let map = this.levelMap.split(MAP_ROW_DELIMITER).map(s => s.split(MAP_COL_DELIMITER));
  
    for (let j = 0; j < map.length; j++) {
      let y = TILE_OFFSET + TILE_SIZE/2 + j*TILE_SIZE;
      for (let i = 0; i < map[j].length; i++) {
        let x = TILE_OFFSET + TILE_SIZE/2 +  TILE_SIZE*i;
        
        let letters = map[j][i];
        for (let letter of letters) {
          if (letter in floorMapTextureCodes) { this.floors.create(x, y, 'floor', helpers.getRandomItem(floorMapTextureCodes[letter])); }
          if (letter in foodMapTextureCodes) { 
            let newFood : Phaser.GameObjects.Sprite = this.food.create(x, y, 'food', foodMapTextureCodes[letter]);
            newFood.setScale(FOOD_SCALE);
          }
          if (letter == "r") { this.player.x = x; this.player.y = y; }
        }
      }
    }
    this.game.scale.resize(this.maxX,this.maxY);

    console.log(this.food.getLength());
    this.floors.setDepth(-100);
    
    //this.game.canvas.style.width = "500px";

    this.player.lookingIndex = 0;
    if (this.player.carryingFruit) this.player.carryingFruit.destroy();
    this.player.isScoopDown = true;
    this.player.refreshFrame(); 
  }

  get maxX() { return Math.max(...(this.floors.children.entries as any).map(e => e.x + TILE_SIZE/2)); }
  get maxY() { return Math.max(...(this.floors.children.entries as any).map(e => e.y + TILE_SIZE/2)); }
  get maxI() { return Math.round((this.maxX - TILE_OFFSET)/TILE_SIZE) - 1};
  get maxJ() { return Math.round((this.maxY - TILE_OFFSET)/TILE_SIZE) - 1};

  getMap() {
    let rows = Array(this.maxJ+1).fill(1).map(e => Array(this.maxI+1).fill(""));
    //floors
    (this.floors.getChildren() as Phaser.GameObjects.Sprite[]).forEach(element => {
      let [i,j] = this.getMapCoords(element.x,element.y);
      let texture = (element as Phaser.GameObjects.Sprite).frame.name;
      for (let key in floorMapTextureCodes) {
        if (floorMapTextureCodes[key].indexOf(texture) > -1) {
          rows[j][i] += key;
        }
      }
    });
    //food
    (this.food.getChildren() as Phaser.GameObjects.Sprite[]).forEach(fruit => {
      if (fruit != this.player.getLookingFruit()) {
        let [i,j] = this.getMapCoords(fruit.x,fruit.y);
        rows[j][i] += this.getFruitCode(fruit);
      }
    });

    return rows.map(row => row.join(MAP_COL_DELIMITER)).join(MAP_ROW_DELIMITER);
  }

  getFruitCode(fruit:Phaser.GameObjects.Sprite) {
    let texture = fruit.frame.name;
    return helpers.getKeyFromValue(foodMapTextureCodes, texture);
  }

  getMapCoords(x,y): number[] {
    let i = Math.floor((x - TILE_OFFSET) / TILE_SIZE);
    let j = Math.floor((y - TILE_OFFSET) / TILE_SIZE);
    return [i,j];
  }
}


class fooBotGame extends Phaser.Game {
  myScene: Scene1;
  constructor(levelMap,parentId) {
    let scene = new Scene1(levelMap);
    let config = {
    
      type    : Phaser.AUTO,
      width   : 200,
      height  : 200,
          
      autoFocus: true,

      transparent: true,
      parent: parentId,
      
      url     : '',
      title   : 'foobot',
      version : '0.0.1', 

      scene   : [ scene ]
    };
    super(config);
    this.myScene = scene;

  }

  getCurrentMap() {
    return this.myScene.getMap();
  }

  run(myCode, onComplete) {
    this.myScene.resetMap();
    this.myScene.player.runCode(myCode, onComplete);
    
   
    /*
    var i = 100000; //counts up to 9998 using a while loop....?
    try {
        while (i-- && myInterpreter.step()) {
            //console.log(i);
        }
    }
    catch (e) { //re-throw to be caught at expression.ts 
        throw new ExpressionError("Error:code did not execute completely\n Detail:  " + (e as Error).message,true,false);  
    }

    if (i == -1) {
        throw new ExpressionError("Error: Code contains an infinite loop",true,false);            
    }
    return "a";*/
  }
}

class fooBotCanvas extends Container implements ValueField, SetImageField {
  errorText: Span; 
  icon: Icon;
  canvasDiv: CanvasCup;
  game: fooBotGame;
  gameNotYetInitialised = true;
  constructor(parent) {
    super(parent,"div");
    this.canvasDiv = new Container(this,"div");
    this.icon = new Icon(this,IconName.none);
    this.errorText = new Span(this,"");
    
    this.appendChildren([this.canvasDiv,this.icon,this.errorText]);
  }

  run(levelMap,code,onComplete) {
    if (this.gameNotYetInitialised) { //first time - called when the comment is checked at the start.
      //but no element exists, so set a timeout
      setTimeout( function(container,levelMap) {
        var container = container;
        var levelMap = levelMap;
        return () => {container.game = new fooBotGame(levelMap,container.canvasDiv.UID);}
      }(this,levelMap), 1000 );
      this.gameNotYetInitialised = false;
      return undefined;
    }
    else {
      if (!this.game) return undefined;
      return this.game.run(code, onComplete);
    }    
  }

  getCurrentMap() { return this.game.getCurrentMap();}

  setDecisionImage(value: IconName) { this.icon.setIconName(value); }
  setValue(value: string) {  }
  getValue() { return "";  }
  setErrorText(value) { 
      this.errorText.innerHTML = value;
      if (value.length > 0) this.setDecisionImage(IconName.error);
  }
  resetError() {
      this.errorText.innerHTML = "";
      if (this.icon.getIconName() == IconName.error) { this.setDecisionImage(IconName.none); }
  }

}