declare function newInterpreter(a:any,b:any): any;

class Robot extends Phaser.GameObjects.Sprite {
    scene: Scene1;
    static instance: Robot;
    
    constructor(scene,x,y) {
        super(scene,x,y,"robot");
        scene.add.existing(this);
        this.setDepth(10);
    }

    moveDown() {
      this.scene.tweens.add({
        targets: this,
        y: this.y+50 ,
        duration: 1000,
        ease: 'Linear',
        repeat: 0,
        yoyo: false,
        paused: false,
        onStart: () => {this.scene.busy = true},
        onComplete: () => {this.scene.busy = false},
      });
    }
}

class Scene1 extends Phaser.Scene {

    static instance: Scene1;
    floors: any;
    player: Robot;
    busy: boolean;
    levelMap: any;
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
        this.load.image("robot","images/robot.png");
        this.load.image("floor","images/floor.png");
    }

    create() {
        this.player = new Robot(this, 100, 100);
        this.floors = this.physics.add.staticGroup();
      
      
        this.setLevel();

        //this.player.setCollideWorldBounds(true);
    }

    setLevel() {
        
        //remove old sprites
        this.floors.clear(true,true);
      
        //c = crate
        let map = this.levelMap.split("\n");
      
        for (let j = 0; j < map.length; j++) {
          let y = 32 + j*64;
          for (let i = 0; i < map[j].length; i++) {
            let x = 32 +  64*i;
            this.floors.create(x, y, 'floor');
            if (map[j][i] == "r") {
              this.player.x = x;
              this.player.y = y;
            }
          }
        }
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

  run(myCode) {
    this.myScene.setLevel();
    var robot = this.myScene.player;
    var initFunc =  (interpreter, globalObject) => {
        var wrapper = function() {
            return robot.moveDown();
        };
        interpreter.setProperty(globalObject, 'moveDown', interpreter.createNativeFunction(wrapper));
    };
    var myInterpreter: any = newInterpreter(myCode, initFunc);
   
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
    return "a";
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

  run(levelMap,code) {
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
      return this.game.run(code);
    }    
  }

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