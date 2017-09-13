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

        //Set up main scene
        this.WALL_RADIUS = WALL_DEPTH;
        this.DIVS_PER_SEGMENT = 6;
        this.ROT_INC_DAILY = (Math.PI * 2)/NUM_WALLS_DAILY;
        this.ROT_INC_WEEKLY = (Math.PI * 2)/NUM_WALLS_WEEKLY;
        this.DIV_ROT_INC = this.ROT_INC_DAILY/this.DIVS_PER_SEGMENT;
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
        this.VIEW_MOVE_INC = 500;
        this.SCENE_MOVE_TIME = 2;
        this.sceneMoveEnd = 0;
        this.BLOCKS_PER_SEGMENT = 5;
        this.NUM_SEGMENTS = 5;
        this.NUM_BLOCKS = this.NUM_SEGMENTS * this.BLOCKS_PER_SEGMENT;
        this.currentLabel = undefined;

        this.currentMonth = MONTHS.JANUARY;
        this.currentWeek = 0;

        this.weeklyView = false;
        this.viewMoving = false;

        //Root group
        this.root = new THREE.Object3D();
        this.addToScene(this.root);

        //Add ground plane
        this.addGround();

        //Main spindles
        let parent = new THREE.Object3D();
        let cylinderGeom = new THREE.CylinderBufferGeometry(CENTRE_RADIUS, CENTRE_RADIUS, CENTRE_HEIGHT, SEGMENTS);
        this.spindleMat = new THREE.MeshLambertMaterial({color: 0xfffb37});
        this.spindleMatDisabled = new THREE.MeshLambertMaterial({color: 0x909090});
        let spindle = new THREE.Mesh(cylinderGeom, this.spindleMat);
        spindle.position.y += CENTRE_HEIGHT/2;
        parent.position.set(WEEKLY_X, WEEKLY_Y, WEEKLY_Z);
        parent.add(spindle);
        this.parentGroupDaily = parent;
        this.root.add(parent);

        //Create structure for weekly data
        let weeklyParent = new THREE.Object3D();
        spindle = new THREE.Mesh(cylinderGeom, this.spindleMat);
        spindle.position.y += CENTRE_HEIGHT/2;
        weeklyParent.add(spindle);
        weeklyParent.position.set(MONTHLY_X, MONTHLY_Y, MONTHLY_Z);
        this.parentGroupWeekly = weeklyParent;
        this.root.add(weeklyParent);

        //Walls
        let wallMat = new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opacity: WALL_OPACITY});
        let wallGeom = new THREE.BoxBufferGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, SEGMENTS, SEGMENTS);
        let spindleInfo = {
            geom: wallGeom,
            mat: wallMat,
            segments: 5,
            blocksPerSegment: 5,
            parent: parent
        };

        this.addSpindle(spindleInfo);

        spindleInfo.segments = 6;
        spindleInfo.parent = weeklyParent;
        this.addSpindle(spindleInfo);

        //Data columns
        cylinderGeom = new THREE.CylinderBufferGeometry(COLUMN_RADIUS, COLUMN_RADIUS, COLUMN_HEIGHT, SEGMENTS, SEGMENTS);

        let blockInfo = {
            geom: cylinderGeom,
            mat: this.spindleMat,
            parent: parent,
            name: "dailyBlock"
        };

        this.columns = [];
        this.addBlocks(blockInfo, this.columns);

        this.weeklyColumns = [];
        blockInfo.parent = weeklyParent;
        blockInfo.name = "weeklyBlock";
        this.addBlocks(blockInfo, this.weeklyColumns);

        //Simple label
        this.labelManager = new LabelManager();
        let position = new THREE.Vector3();
        position.copy(this.columns[2].position);
        let label = this.labelManager.create("priceLabel", "Tony", position);
        this.addToScene(label.getSprite());
        this.currentLabel = label;

        //Load in data
        let dataLoad = new dataLoader();
        dataLoad.load("data/ftse100_2016.json", data => {
            this.data = data;
            this.preProcessData();
            this.updateScene();
        });
    }

    addSpindle(spindleInfo) {
        let i, wall, wallGroup;
        let rotation = (Math.PI * 2)/spindleInfo.segments;
        for(i=0; i<spindleInfo.segments; ++i) {
            wall = new THREE.Mesh(spindleInfo.geom, spindleInfo.mat);
            wallGroup = new THREE.Object3D();
            wallGroup.rotation.y = (rotation*(i + 1)) + rotation/2;
            wall.position.set(0, WALL_HEIGHT/2, WALL_DEPTH/2);
            wallGroup.add(wall);
            spindleInfo.parent.add(wallGroup);
        }
    }

    addBlocks(blockInfo, columns) {
        let i, blockNum = 0, segment, column;
        for(segment=0; segment<NUM_SEGMENTS; ++segment) {
            for(i=0; i<NUM_COLUMNS_PER_SEGMENT; ++i) {
                column = new THREE.Mesh(blockInfo.geom, blockInfo.mat);
                column.position.copy(this.getBlockPosition(segment, i));
                column.position.y += COLUMN_HEIGHT/2;
                column.name = blockInfo.name + blockNum;
                ++blockNum;
                blockInfo.parent.add(column);
                columns.push(column);
            }
        }
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
        this.root.add(ground);
    }

    preProcessData() {
        //Normalise input
        let dailyPricesPerMonth = [], dailyPrices = [];
        let realDailyPricesPerMonth = [], realDailyPrices = [];
        let numShares;
        let currentPrice;
        for(let month=MONTHS.JANUARY; month<=MONTHS.DECEMBER; ++month) {
            numShares = this.data[month].shares.length;
            for (let share = 0; share < numShares; ++share) {
                currentPrice = this.data[month].shares[share];
                dailyPrices.push(currentPrice[CLOSE_PRICE]);
                realDailyPrices.push(currentPrice[CLOSE_PRICE]);
            }
            dailyPricesPerMonth.push(dailyPrices);
            realDailyPricesPerMonth.push(realDailyPrices);
            dailyPrices = [];
            realDailyPrices = [];
        }

        let max, min, delta, shares, largest = -1, smallest = 1000000;
        for(let month=0, numMonths=dailyPricesPerMonth.length; month<numMonths; ++month) {
            shares = dailyPricesPerMonth[month];
            max = Math.max(...shares);
            min = Math.min(...shares);
            if(max > largest) largest = max;
            if(min < smallest) smallest = min;
        }
        //Normalise shares
        delta = largest - smallest;
        for(let month=0, numMonths=dailyPricesPerMonth.length; month<numMonths; ++month) {
            shares = dailyPricesPerMonth[month];
            numShares = shares.length;
            for(let share=0; share<numShares; ++share) {
                shares[share] = (((shares[share] - smallest)/delta)*100)+1;
            }
        }
        this.dailyPricesPerMonth = dailyPricesPerMonth;
        this.realDailyPricesPerMonth = realDailyPricesPerMonth;

        //Weekly totals organised by month
        let weeklyPricesPerMonth = [], weeklyPrices = [];
        for(let month=MONTHS.JANUARY; month<=MONTHS.DECEMBER; ++month) {
            weeklyPrices = this.data[month].sharesWeekly;
            weeklyPricesPerMonth.push(weeklyPrices);
        }
        largest = -1;
        smallest = 1000000;
        for(let month=MONTHS.JANUARY; month<=MONTHS.DECEMBER; ++month) {
            shares = weeklyPricesPerMonth[month];
            max = Math.max(...shares);
            min = Math.min(...shares);
            if(max > largest) largest = max;
            if(min < smallest) smallest = min;
        }
        delta = largest - smallest;
        for(let month=MONTHS.JANUARY; month<=MONTHS.DECEMBER; ++month) {
            shares = weeklyPricesPerMonth[month];
            for(let share=0, numShares=shares.length; share<numShares; ++share) {
                shares[share] = (((shares[share] - smallest)/delta)*100)+1;
            }
        }
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
        let dailyPrices = this.dailyPricesPerMonth[month];
        for(i=start; i<numSlots; ++i) {
            this.setShareDailyPrice(i, dailyPrices[i-start]);
            this.setShareWeeklyPrice(i, dailyPrices[i-start]);
        }
    }

    clearBlocks() {
        //Set all materials and scales for blocks
        for(let block=0, numBlocks=this.columns.length; block<numBlocks; ++block) {
            this.columns[block].material = this.spindleMat;
            this.columns[block].scale.set(1, 1, 1);
        }
    }

    clearWeeklyBlocks() {
        for(let block=0, numBlocks=this.weeklyColumns.length; block<numBlocks; ++block) {
            this.weeklyColumns[block].material = this.spindleMat;
            this.weeklyColumns[block].scale.set(1, 1, 1);
        }
    }

    disableBlock(blockNumber) {
        //Grey out given block number
        this.columns[blockNumber].material = this.spindleMatDisabled;
    }

    disableWeeklyBlock(blockNumber) {
        //Grey out given block number
        this.weeklyColumns[blockNumber].material = this.spindleMatDisabled;
    }

    setShareDailyPrice(block, price) {
        //Scale price to reasonable size
        let currentBlock = this.columns[block];
        currentBlock.scale.set(1, price, 1);
        currentBlock.position.y = price/2;
    }

    setShareWeeklyPrice(block, price) {
        //Scale price to relative size
        let currentBlock = this.weeklyColumns[block];
        currentBlock.scale.set(1, price, 1);
        currentBlock.position.y = price/2;
    }

    getShareText(block) {
        let dailyPrices = this.realDailyPricesPerMonth[this.currentMonth];
        return dailyPrices[block];
    }

    getBlockPosition(segment, position) {
        //Get block number
        let block = (segment * this.DIVS_PER_SEGMENT) + position;
        let rot = (block - this.SEG_OFFSET) * this.DIV_ROT_INC;
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
            this.rotateGroup.rotation.y += (this.rotSpeed * delta);
            if(this.rotationTime >= this.SCENE_ROTATE_TIME) {
                this.rotateGroup.rotation.y = this.sceneRotEnd;
                this.rotationTime = 0;
                this.sceneRotating = false;
            }
        }

        if(this.sceneMoving) {
            if(!this.animate) this.moveTime = this.SCENE_MOVE_TIME;
            this.moveTime += delta;
            this.parentGroupDaily.position.y += (this.moveSpeed * delta);
            if(this.moveTime >= this.SCENE_MOVE_TIME) {
                this.parentGroupDaily.position.y = this.sceneMoveEnd;
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

        if(this.viewMoving) {
            this.moveTime += delta;
            this.root.position.x += (this.moveSpeed * delta);
            if(this.moveTime >= this.SCENE_MOVE_TIME) {
                this.root.position.x = this.sceneMoveEnd;
                this.moveTime = 0;
                this.viewMoving = false;
                this.changeViews();
            }
        }

        this.currentLabel.setVisibility(false);
        if(this.hoverObjects.length) {
            let text = this.hoverObjects[0].object.name;
            //DEBUG
            //console.log("Hovered over ", text);

            if(text.indexOf("Block") < 0) return;

            let index = text.match(/\d+$/);
            if(!index) return;

            text = this.getShareText(index[0]);
            if(!text) text = "n/a";
            this.currentLabel.setWorldPosition(this.hoverObjects[0].object.matrixWorld);
            this.currentLabel.updateY(1.85);
            this.currentLabel.setVisibility(true);
            this.currentLabel.setText(text);
        }
    }

    previousSegment() {
        //Move to previous segment
        if(this.sceneRotating) return;

        let increment = this.weeklyView ? this.ROT_INC_WEEKLY : this.ROT_INC_DAILY;
        this.rotateGroup = this.weeklyView ? this.parentGroupWeekly : this.parentGroupDaily;
        this.rotSpeed = increment / this.SCENE_ROTATE_TIME;
        this.sceneRotEnd = this.rotateGroup.rotation.y + increment;
        if(--this.currentWeek < 0) this.currentWeek = DATES.WEEKS_PER_MONTH;
        this.sceneRotating = true;

        let showWeek = this.currentWeek + 1;
        $('#week').html(showWeek);
    }

    nextSegment() {
        //Move to next segment
        if(this.sceneRotating) return;

        let increment = this.weeklyView ? this.ROT_INC_WEEKLY : this.ROT_INC_DAILY;
        this.rotSpeed = -increment / this.SCENE_ROTATE_TIME;
        this.rotateGroup = this.weeklyView ? this.parentGroupWeekly : this.parentGroupDaily;
        this.sceneRotEnd = this.rotateGroup.rotation.y - increment;
        if(++this.currentWeek > DATES.WEEKS_PER_MONTH) this.currentWeek = 0;
        this.sceneRotating = true;

        let showWeek = this.currentWeek + 1;
        $('#week').html(showWeek);
    }

    nextMonth() {
        //Animate to show next month
        if(this.sceneMoving) return;

        if(this.weeklyView) {
            this.nextSegment();
            return;
        }

        this.moveSpeed = this.MOVE_INC / this.SCENE_MOVE_TIME;
        this.sceneMoveEnd = this.parentGroupDaily.position.y + this.MOVE_INC;
        this.sceneMoving = true;
        ++this.currentMonth;
        if(this.currentMonth > MONTHS.DECEMBER) this.currentMonth = MONTHS.JANUARY;
    }

    previousMonth() {
        //Animate to show next month
        if(this.sceneMoving) return;

        if(this.weeklyView) {
            this.previousSegment();
            return;
        }

        this.moveSpeed = this.MOVE_INC / this.SCENE_MOVE_TIME;
        this.sceneMoveEnd = this.parentGroupDaily.position.y + this.MOVE_INC;
        this.sceneMoving = true;
        --this.currentMonth;
        if(this.currentMonth < MONTHS.JANUARY) this.currentMonth = MONTHS.DECEMBER;
    }

    toggleView() {
        this.weeklyView = !this.weeklyView;
        this.viewMoving = true;
        this.moveToView();
    }

    changeViews() {
        let text = this.weeklyView ? "Weekly" : "Daily";
        $('#toggleView').html(text);
        let weekControls = $('#weekControls');
        let weekInfo = $('#weekData');
        weekControls.show();
        weekInfo.show();
        if(this.weeklyView) {
            weekControls.hide();
            weekInfo.hide();
        }
    }

    moveToView() {
        let distance = this.VIEW_MOVE_INC;
        this.moveSpeed = this.VIEW_MOVE_INC / this.SCENE_MOVE_TIME;
        this.moveSpeed *= this.weeklyView ? -1 : 1;
        distance *= this.weeklyView ? -1 : 1;
        this.sceneMoveEnd = this.root.position.x + distance;
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

    $('#toggleView').on("click", () => {
        app.toggleView();
    });

    app.run();

});
