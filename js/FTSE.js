/**
 * Created by DrTone on 06/07/2017.
 */



class FTSEApp extends BaseApp {
    constructor() {
        super();

    }

    createScene() {
        //Init base createsScene
        super.createScene();

        //Add ground plane
        this.addGround();

        //Set up main scene
        this.WALL_RADIUS = WALL_DEPTH;
        this.DIVS_PER_SEGMENT = 6;
        this.ROT_INC = (Math.PI * 2)/NUM_WALLS;
        this.DIV_ROT_INC = this.ROT_INC/this.DIVS_PER_SEGMENT;
        this.SEG_OFFSET = 2;
        this.SCENE_ROTATE_TIME = 2;
        this.sceneRotating = false;
        this.sceneMoving = false;
        this.sceneRotStart = 0;
        this.sceneRotEnd = 0;
        this.rotSpeed = 0;
        this.rotationTime = 0;
        this.moveTime = 0;
        this.animate = true;
        this.moveSpeed = 0;
        this.MOVE_INC = -110;
        this.SCENE_MOVE_TIME = 2;
        this.sceneMoveEnd = 0;
        this.BLOCKS_PER_SEGMENT = 5;
        this.NUM_SEGMENTS = 5;
        this.NUM_BLOCKS = this.NUM_SEGMENTS * this.BLOCKS_PER_SEGMENT;

        this.currentMonth = MONTHS.JANUARY;
        this.currentWeek = 0;

        //Main spindle
        let parent = new THREE.Object3D();
        let cylinderGeom = new THREE.CylinderBufferGeometry(CENTRE_RADIUS, CENTRE_RADIUS, CENTRE_HEIGHT, SEGMENTS);
        this.spindleMat = new THREE.MeshLambertMaterial({color: 0xfffb37});
        this.spindleMatDisabled = new THREE.MeshLambertMaterial({color: 0x909090});
        let spindle = new THREE.Mesh(cylinderGeom, this.spindleMat);
        spindle.position.y += CENTRE_HEIGHT/2;
        parent.add(spindle);
        this.addToScene(parent);

        //Walls
        let i, wall, wallGroup, wallGroups = [];
        const WALL_OPACITY = 0.55;
        let wallMat = new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opacity: WALL_OPACITY});
        let wallGeom = new THREE.BoxBufferGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, SEGMENTS, SEGMENTS);
        for(i=0; i<NUM_WALLS; ++i) {
            wall = new THREE.Mesh(wallGeom, wallMat);
            wallGroup = new THREE.Object3D();
            wallGroup.rotation.y = (this.ROT_INC*(i + 1)) + this.ROT_INC/2;
            wall.position.set(0, WALL_HEIGHT/2, WALL_DEPTH/2);
            wallGroup.add(wall);
            wallGroups.push(wallGroup);
            parent.add(wallGroup);
        }

        //Data columns
        const COLUMN_HEIGHT = 2;
        const COLUMN_RADIUS = 3;
        let column;
        const NUM_SEGMENTS = 5;
        const NUM_COLUMNS_PER_SEGMENT = 5;
        cylinderGeom = new THREE.CylinderBufferGeometry(COLUMN_RADIUS, COLUMN_RADIUS, COLUMN_HEIGHT, SEGMENTS, SEGMENTS);
        let segment;
        this.columns = [];
        for(segment=0; segment<NUM_SEGMENTS; ++segment) {
            for(i=0; i<NUM_COLUMNS_PER_SEGMENT; ++i) {
                column = new THREE.Mesh(cylinderGeom, this.spindleMat);
                column.position.copy(this.getBlockPosition(segment, i));
                column.position.y += COLUMN_HEIGHT/2;
                parent.add(column);
                this.columns.push(column);
            }
        }

        this.parentGroup = parent;

        //Load in data
        let dataLoad = new dataLoader();
        dataLoad.load("data/ftse100_2016.json", data => {
            this.data = data;
            this.preProcessData();
            this.updateScene();
        });
    }

    createGUI() {
        //Create GUI - controlKit
        window.addEventListener('load', () => {
            let appearanceConfig = {
                Back: '#5c5f64',
                Ground: '#0c245c',
                Block: '#fffb37'
            };
            let settingsConfig = {
              Animate: true
            };

            let controlKit = new ControlKit();

            controlKit.addPanel({width: 200})
                .addGroup({label: "Appearance", enable: false})
                    .addColor(appearanceConfig, "Back", {
                        colorMode: "hex", onChange: () => {
                            this.onBackgroundColourChanged(appearanceConfig.Back);
                        }
                    })
                    .addColor(appearanceConfig, "Ground", {
                        colorMode: "hex", onChange: () => {
                            this.onGroundColourChanged(appearanceConfig.Ground);
                        }
                    })
                    .addColor(appearanceConfig, "Block", {
                        colorMode: "hex", onChange: () => {
                            this.onBlockColourChanged(appearanceConfig.Block);
                        }
                    })
                .addGroup( {label: "Settings", enable: false})
                .addCheckbox(settingsConfig, "Animate", {
                    onChange: () => {
                        this.toggleAnimation();
                    }
                })
        });
    }

    onBackgroundColourChanged(colour) {
        this.renderer.setClearColor(colour, 1.0);
    }

    onGroundColourChanged(colour) {
        let ground = this.getObjectByName('Ground');
        if(ground) {
            ground.material.color.setStyle(colour);
        }
    }

    onBlockColourChanged(colour) {
        this.spindleMat.color.setStyle(colour);
    }

    toggleAnimation() {
        this.animate = !this.animate;
    }

    addGround() {
        //Ground plane
        const GROUND_WIDTH = 1000, GROUND_HEIGHT = 640, SEGMENTS = 16;
        let groundGeom = new THREE.PlaneBufferGeometry(GROUND_WIDTH, GROUND_HEIGHT, SEGMENTS, SEGMENTS);
        let groundMat = new THREE.MeshLambertMaterial( {color: 0x0c245c} );
        let ground = new THREE.Mesh(groundGeom, groundMat);
        ground.name = "Ground";
        ground.rotation.x = -Math.PI/2;
        this.addToScene(ground);
    }

    preProcessData() {
        //Normalise input
        let monthlyPrices = [], dailyPrices = [];
        let numShares;
        let currentPrice;
        const CLOSE_PRICE = 2;
        for(let month=MONTHS.JANUARY; month<=MONTHS.DECEMBER; ++month) {
            numShares = this.data[month].shares.length;
            for (let share = 0; share < numShares; ++share) {
                currentPrice = this.data[month].shares[share];
                dailyPrices.push(currentPrice[CLOSE_PRICE]);
            }
            monthlyPrices.push(dailyPrices);
            dailyPrices = [];
        }

        let max, min, delta, shares;
        for(let month=0, numMonths=monthlyPrices.length; month<numMonths; ++month) {
            shares = monthlyPrices[month];
            max = Math.max(...shares);
            min = Math.min(...shares);
            delta = max - min;
            //Normalise shares
            numShares = shares.length;
            for(let share=0; share<numShares; ++share) {
                shares[share] = (((shares[share] - min)/delta)*100)+1;
            }
        }
        this.monthlyPrices = monthlyPrices;
    }

    updateScene() {
        //Update info
        let month = this.currentMonth;
        $('#year').html(this.data[month].year);
        $('#month').html(this.data[month].month);

        //Grey out unused blocks for each month
        this.clearBlocks();
        let i, start = this.data[month].startSlot, end = this.data[month].endSlot;
        if(start > 0) {
            for(i=0; i<start; ++i) {
                this.disableBlock(i);
            }
        }
        if(end < (this.BLOCKS_PER_SEGMENT - 1)) {
            let segment = 4 * this.BLOCKS_PER_SEGMENT;
            for(i = segment + end + 1; i<this.NUM_BLOCKS; ++i) {
                this.disableBlock(i);
            }
        }

        let numShares = this.data[month].shares.length;
        let numSlots = numShares + start;
        let dailyPrices = this.monthlyPrices[month];
        for(i=start; i<numSlots; ++i) {
            this.setSharePrice(i, dailyPrices[i-start]);
        }
    }

    clearBlocks() {
        //Set all materials and scales for blocks
        for(let block=0, numBlocks=this.columns.length; block<numBlocks; ++block) {
            this.columns[block].material = this.spindleMat;
            this.columns[block].scale.set(1, 1, 1);
        }
    }

    disableBlock(blockNumber) {
        //Grey out given block number
        this.columns[blockNumber].material = this.spindleMatDisabled;
    }

    setSharePrice(block, price) {
        //Scale price to reasonable size
        this.columns[block].scale.set(1, price, 1);
    }

    getBlockPosition(segment, position) {
        //Get block number
        let block = (segment * this.DIVS_PER_SEGMENT) - this.SEG_OFFSET;
        block += position;
        let rot = block * this.DIV_ROT_INC;
        let posX = this.WALL_RADIUS * Math.sin(rot);
        let posY = 0;
        let posZ = this.WALL_RADIUS * Math.cos(rot);
        return new THREE.Vector3(posX, posY, posZ);
    }

    update() {
        super.update();
        let delta = this.clock.getDelta();
        this.elapsedTime += delta;

        if(this.sceneRotating) {
            if(!this.animate) this.rotationTime = this.SCENE_ROTATE_TIME;
            this.rotationTime += delta;
            this.parentGroup.rotation.y += (this.rotSpeed * delta);
            if(this.rotationTime >= this.SCENE_ROTATE_TIME) {
                this.parentGroup.rotation.y = this.sceneRotEnd;
                this.rotationTime = 0;
                this.sceneRotating = false;
            }
        }

        if(this.sceneMoving) {
            if(!this.animate) this.moveTime = this.SCENE_ROTATE_TIME;
            this.moveTime += delta;
            this.parentGroup.position.y += (this.moveSpeed * delta);
            if(this.moveTime >= this.SCENE_MOVE_TIME) {
                this.parentGroup.position.y = this.sceneMoveEnd;
                this.moveTime = 0;
                if(this.MOVE_INC < 0) {
                    this.sceneMoveEnd = 0;
                    this.updateScene();
                } else {
                    this.sceneMoving = false;
                }
                this.MOVE_INC *= -1;
                this.moveSpeed = this.MOVE_INC / this.SCENE_MOVE_TIME;
            }
        }
    }

    previousSegment() {
        //Move to previous segment
        if(this.sceneRotating) return;
        if(--this.currentWeek < 0) this.currentWeek = DATES.WEEKS_PER_MONTH;
        this.rotSpeed = this.ROT_INC / this.SCENE_ROTATE_TIME;
        this.sceneRotEnd = this.parentGroup.rotation.y + this.ROT_INC;
        this.sceneRotating = true;

        let showWeek = this.currentWeek + 1;
        $('#week').html(showWeek);
    }

    nextSegment() {
        //Move to next segment
        if(this.sceneRotating) return;
        if(++this.currentWeek > DATES.WEEKS_PER_MONTH) this.currentWeek = 0;
        this.rotSpeed = -this.ROT_INC / this.SCENE_ROTATE_TIME;
        this.sceneRotEnd = this.parentGroup.rotation.y - this.ROT_INC;
        this.sceneRotating = true;

        let showWeek = this.currentWeek + 1;
        $('#week').html(showWeek);
    }

    nextMonth() {
        //Animate to show next month
        if(this.sceneMoving) return;

        this.moveSpeed = this.MOVE_INC / this.SCENE_MOVE_TIME;
        this.sceneMoveEnd = this.parentGroup.position.y + this.MOVE_INC;
        this.sceneMoving = true;
        ++this.currentMonth;
        if(this.currentMonth > MONTHS.DECEMBER) this.currentMonth = MONTHS.JANUARY;
    }

    previousMonth() {
        //Animate to show next month
        if(this.sceneMoving) return;

        this.moveSpeed = this.MOVE_INC / this.SCENE_MOVE_TIME;
        this.sceneMoveEnd = this.parentGroup.position.y + this.MOVE_INC;
        this.sceneMoving = true;
        --this.currentMonth;
        if(this.currentMonth < MONTHS.JANUARY) this.currentMonth = MONTHS.DECEMBER;
    }
}

$(document).ready( () => {
    let container = document.getElementById("WebGL-output");
    let app = new FTSEApp();
    app.init(container);
    app.createGUI();
    app.createScene();

    $('#nextMonth').on("click", () => {
        app.nextMonth();
    });

    $('#previousMonth').on("click", () => {
        app.previousMonth();
    });

    $('#previousWeek').on("click", () => {
        app.previousSegment();
    });

    $('#nextWeek').on("click", () => {
        app.nextSegment();
    });

    app.run();

});
