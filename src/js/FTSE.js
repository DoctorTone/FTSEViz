/**
 * Created by DrTone on 06/07/2017.
 */
import $ from "jquery";
import * as THREE from "three";
import { BaseApp } from "./baseApp";

let appearanceConfig = {
    Back: '#5c5f64',
    Ground: '#0c245c',
    Block: '#fffb37'
};

let saveConfig = {
    Back: appearanceConfig.Back,
    Ground: appearanceConfig.Ground,
    Block: appearanceConfig.Block
};

class FTSEApp extends BaseApp {
    constructor() {
        super();

        this.baseName = "FTSEVizConfig";
        this.messageTimer = 3 * 1000;
        this.zoomingOut = false;
        this.zoomingIn = false;
        this.showLabels = true;
        this.showPrices = false;
    }

    init(container) {
        super.init(container);

        //Load any preferences
        let prefs = localStorage.getItem(this.baseName + "Saved");
        if(prefs) {
            let value;
            for(let prop in appearanceConfig) {
                value = localStorage.getItem(this.baseName + prop);
                if(value) {
                    this.setGUI(prop, value);
                }
            }
            let colour = localStorage.getItem(this.baseName + "Back");
            if(colour) {
                this.renderer.setClearColor(colour, 1.0);
            }
        }
    }

    createScene() {
        //Init base createsScene
        super.createScene();

        this.fitToScreen();

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
        this.moveSpeed = MOVE_SPEED;
        this.MOVE_INC = -110;
        this.VIEW_MOVE_INC = 500;
        this.SCENE_MOVE_TIME = 2;
        this.sceneMoveEnd = 0;
        this.BLOCKS_PER_SEGMENT = 5;
        this.NUM_SEGMENTS = 5;
        this.NUM_BLOCKS = this.NUM_SEGMENTS * this.BLOCKS_PER_SEGMENT;
        this.currentLabel = undefined;

        this.currentMonthDaily = MONTHS.JANUARY;
        this.currentMonthWeekly = MONTHS.JANUARY;

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
        this.spindleMat = new THREE.MeshLambertMaterial({color: appearanceConfig.Block});
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
        this.parentGroupWeekly.rotation.y = -(this.ROT_INC_DAILY * 2);
        this.facingSegment = 2;
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

        //Single label
        this.labelManager = new LabelManager();
        let position = new THREE.Vector3();
        //position.copy(this.columns[2].position);
        let scale = new THREE.Vector3(20, 10, 1);
        let labelProperty = {};
        labelProperty.position = position;
        labelProperty.scale = scale;
        labelProperty.multiLine = false;
        let label = this.labelManager.create("shareLabel", "Tony", labelProperty);
        this.addToScene(label.getSprite());
        this.currentLabel = label;

        //Load in data
        let dataLoad = new dataLoader();
        dataLoad.load("data/ftse100_2016.json", data => {
            this.data = data;
            this.preProcessData();
            this.updateSceneDaily();
            this.setSceneWeekly();
            this.addPriceDailyLabels();
            this.addPriceWeeklyLabels();
            this.addDateLabels();
            this.addWeekLabels();
        });
    }

    fitToScreen() {
        //If in portrait mode then move camera
        if(window.innerHeight > window.innerWidth) {
            this.setCamera(FAR);
        } else {
            this.setCamera(NEAR);
        }
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
                column.position.copy(this.getBlockPosition(segment, i, this.WALL_RADIUS));
                column.position.y += COLUMN_HEIGHT/2;
                column.name = blockInfo.name + blockNum;
                ++blockNum;
                blockInfo.parent.add(column);
                columns.push(column);
            }
        }
    }

    addDateLabels() {
        let labelProperty, text;
        let scale = new THREE.Vector3(20, 10, 1);
        let label, labelNumber = 0, labelOffsetY = 5;
        let data = this.data[this.currentMonthDaily].shares;

        for(let segment=0; segment<NUM_SEGMENTS; ++segment) {
            for(let i=0; i<NUM_COLUMNS_PER_SEGMENT; ++i) {
                labelProperty = {};
                labelProperty.position = new THREE.Vector3();
                labelProperty.position.copy(this.getBlockPosition(segment, i, this.WALL_RADIUS * 1.075));
                labelProperty.position.y += labelOffsetY;
                labelProperty.scale = scale;
                labelProperty.multiLine = false;
                labelProperty.visibility = true;
                labelProperty.textColour = "rgba(255, 165, 0, 1.0)";
                if(data[labelNumber] === undefined) {
                    text = "";
                } else {
                    text = data[labelNumber][0];
                }
                label = this.labelManager.create("dateLabel" + labelNumber, text, labelProperty);
                this.parentGroupDaily.add(label.getSprite());
                ++labelNumber;
            }
        }
    }

    clearDateLabels() {
        let totalLabels = NUM_SEGMENTS * NUM_COLUMNS_PER_SEGMENT;
        let label, labelName = "dateLabel";
        for(let i=0; i<totalLabels; ++i) {
            label = this.labelManager.getLabel(labelName + i);
            if(label) {
                label.setText("");
            }
        }
    }

    addPriceDailyLabels() {
        let labelProperty;
        let scale = new THREE.Vector3(20, 10, 1);
        let label, labelNumber = 0, labelOffsetY = 7, price;
        let data = this.data[this.currentMonthDaily].shares;

        for(let segment=0; segment<NUM_SEGMENTS; ++segment) {
            for(let i=0; i<NUM_COLUMNS_PER_SEGMENT; ++i) {
                labelProperty = {};
                labelProperty.position = new THREE.Vector3();
                labelProperty.position.copy(this.getBlockPosition(segment, i, this.WALL_RADIUS));
                labelProperty.position.y += (this.getBlockHeight(labelNumber) * 2);
                labelProperty.position.y += labelOffsetY;
                labelProperty.scale = scale;
                labelProperty.multiLine = false;
                labelProperty.visibility = false;
                if(data[labelNumber] === undefined) {
                    price = "No data";
                } else {
                    price = this.getShareText(labelNumber);
                    if(price === undefined) price = "";
                }
                label = this.labelManager.create("priceDailyLabel" + labelNumber, price, labelProperty);
                this.parentGroupDaily.add(label.getSprite());
                ++labelNumber;
            }
        }
    }

    addPriceWeeklyLabels() {
        let labelProperty;
        let scale = new THREE.Vector3(20, 10, 1);
        let label, labelNumber = 0, labelOffsetY = 7, price;
        let data = this.data[this.currentMonthWeekly].sharesWeekly;

        for(let segment=0; segment<NUM_SEGMENTS; ++segment) {
            for(let i=0; i<NUM_COLUMNS_PER_SEGMENT; ++i) {
                labelProperty = {};
                labelProperty.position = new THREE.Vector3();
                labelProperty.position.copy(this.getBlockPosition(segment, i, this.WALL_RADIUS));
                labelProperty.position.y += (this.getBlockHeight(labelNumber) * 2);
                labelProperty.position.y += labelOffsetY;
                labelProperty.scale = scale;
                labelProperty.multiLine = false;
                labelProperty.visibility = false;
                if(data[labelNumber] === undefined) {
                    price = "No data";
                } else {
                    price = this.getShareText(labelNumber);
                    if(price === undefined) price = "";
                }
                label = this.labelManager.create("priceWeeklyLabel" + labelNumber, price, labelProperty);
                this.parentGroupWeekly.add(label.getSprite());
                ++labelNumber;
            }
        }
    }

    addWeekLabels() {
        let labelProperty;
        let scale = new THREE.Vector3(20, 10, 1);
        let label, labelNumber = 0, labelOffsetY = 5, week;

        for(let segment=0; segment<NUM_SEGMENTS; ++segment) {
            for(let i=0; i<NUM_COLUMNS_PER_SEGMENT; ++i) {
                labelProperty = {};
                labelProperty.position = new THREE.Vector3();
                labelProperty.position.copy(this.getBlockPosition(segment, i, this.WALL_RADIUS * 1.075));
                labelProperty.position.y += labelOffsetY;
                labelProperty.scale = scale;
                labelProperty.multiLine = false;
                labelProperty.visibility = true;
                labelProperty.textColour = "rgba(255, 165, 0, 1.0)";
                week = i + 1;
                label = this.labelManager.create("weeklyLabel" + labelNumber, "Week" + week, labelProperty);
                this.parentGroupWeekly.add(label.getSprite());
                ++labelNumber
            }
        }
    }

    updateDateLabels() {
        this.clearDateLabels();
        let label, baseName = "dateLabel", labelNumber = 0, dayNumber = 0;
        let month = this.currentMonthDaily;
        let data = this.data[month].shares;
        let start = this.data[month].startSlot, end = this.data[month].endSlot + (4 *NUM_COLUMNS_PER_SEGMENT);
        let text;

        for(let segment=0; segment<NUM_SEGMENTS; ++segment) {
            for (let i = 0; i < NUM_COLUMNS_PER_SEGMENT; ++i) {
                label = this.labelManager.getLabel(baseName + labelNumber);
                if(label) {
                    text = labelNumber > end ? "" : labelNumber < start ? "" : data[dayNumber++][0];
                    label.setText(text);
                }
                ++labelNumber;
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
              Animate: true,
              Labels: true,
              Prices: false
            };

            let guiWidth = $('#guiWidth').css("width");
            guiWidth = parseInt(guiWidth, 10);
            if(!guiWidth) guiWidth = window.innerWidth * 0.1;
            let controlKit = new ControlKit();

            controlKit.addPanel({label: "Configuration", width: guiWidth, enable: false})
                .addSubGroup({label: "Appearance", enable: false})
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
                .addSubGroup( {label: "Settings", enable: false})
                    .addCheckbox(settingsConfig, "Animate", {
                        onChange: () => {
                            this.toggleAnimation();
                        }
                    })
                    .addCheckbox(settingsConfig, "Labels", {
                        onChange: () => {
                            this.toggleLabels();
                        }
                    })
                    .addCheckbox(settingsConfig, "Prices", {
                        onChange: () => {
                            this.togglePrices();
                        }
                    })
                .addSubGroup( {label: "Preferences"})
                    .addButton("Save", () => {
                        for(let prop in saveConfig) {
                            if(prop in appearanceConfig) {
                                saveConfig[prop] = appearanceConfig[prop];
                            }
                        }
                        this.savePreferences(saveConfig);
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

    savePreferences(config) {
        for(let prop in config) {
            localStorage.setItem(this.baseName + prop, config[prop]);
        }
        localStorage.setItem(this.baseName + "Saved", "Saved");
        this.displayMessage("Preferences saved");
    }

    setGUI(prop, value) {
        let newValue = parseFloat(value);
        if(isNaN(newValue)) {
            appearanceConfig[prop] = value;
            return;
        }
        appearanceConfig[prop] = newValue;
    }

    toggleAnimation() {
        this.animate = !this.animate;
    }

    toggleLabels() {
        this.showLabels = !this.showLabels;

        let dateName = "dateLabel", weekLabel = "weeklyLabel";
        let label;
        let totalLabels = NUM_SEGMENTS * NUM_COLUMNS_PER_SEGMENT;
        for(let i=0; i<totalLabels; ++i) {
            label = this.labelManager.getLabel(dateName + i);
            if(label) {
                label.setVisibility(this.showLabels);
            }
            label = this.labelManager.getLabel(weekLabel + i);
            if(label) {
                label.setVisibility(this.showLabels);
            }
        }
    }

    togglePrices() {
        this.showPrices = !this.showPrices;

        this.showPriceLabels(this.showPrices);
    }

    showPriceLabels(visible) {
        let labelName = this.weeklyView ? "priceWeeklyLabel" : "priceDailyLabel";
        let label, text;
        let totalLabels = NUM_SEGMENTS * NUM_COLUMNS_PER_SEGMENT;
        for(let i=0; i<totalLabels; ++i) {
            label = this.labelManager.getLabel(labelName + i);
            if(label) {
                label.setVisibility(visible);
                if(visible) {
                    text = this.getShareText(i);
                    if(text) {
                        label.setText(text < 0 ? "" : text);
                        label.setHeight((this.getBlockHeight(i) * 2) + 6);
                    }
                }
            }
        }
    }

    addGround() {
        //Ground plane
        const GROUND_WIDTH = 1000, GROUND_HEIGHT = 640, SEGMENTS = 16;
        let groundGeom = new THREE.PlaneBufferGeometry(GROUND_WIDTH, GROUND_HEIGHT, SEGMENTS, SEGMENTS);
        let groundMat = new THREE.MeshLambertMaterial( {color: appearanceConfig.Ground} );
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
        let realWeeklyPricesPerMonth = [], realWeeklyPrices = [];
        for(let month=MONTHS.JANUARY; month<=MONTHS.DECEMBER; ++month) {
            weeklyPrices = this.data[month].sharesWeekly;
            realWeeklyPrices = weeklyPrices.slice();
            weeklyPricesPerMonth.push(weeklyPrices);
            realWeeklyPricesPerMonth.push(realWeeklyPrices);
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
        //Fix months that don't have 5 weeks
        let jan = weeklyPricesPerMonth[0];
        jan.push(-1);
        jan = realWeeklyPricesPerMonth[0];
        jan.push(-1);
        this.weeklyPricesPerMonth = weeklyPricesPerMonth;
        this.realWeeklyPricesPerMonth = realWeeklyPricesPerMonth;
    }

    updateSceneDaily() {
        //Update info
        let month = this.currentMonthDaily;
        $('#year').html(this.data[month].year);
        $('#month').html(this.data[month].month);

        //Grey out unused blocks for each month
        this.clearBlocks();
        let i, start = this.data[month].startSlot, end = this.data[month].endSlot;
        if (start > 0) {
            for (i = 0; i < start; ++i) {
                this.disableBlock(i);
            }
        }
        if(end < 0) {
            //Disable last week
            let segment = 4 * this.BLOCKS_PER_SEGMENT;
            for(i=segment; i<this.NUM_BLOCKS; ++i) {
                this.disableBlock(i);
            }
        }

        if (end < (this.BLOCKS_PER_SEGMENT - 1)) {
            let segment = 4 * this.BLOCKS_PER_SEGMENT;
            for (i = segment + end + 1; i < this.NUM_BLOCKS; ++i) {
                this.disableBlock(i);
            }
        }

        let numShares = this.data[month].shares.length;
        let numSlots = numShares + start;
        let dailyPrices = this.dailyPricesPerMonth[month];
        for (i = start; i < numSlots; ++i) {
            this.setShareDailyPrice(i, dailyPrices[i - start]);
        }

    }

    setSceneWeekly() {
        let month = this.currentMonthWeekly - 2;
        if(month < 0) {
            month += NUM_MONTHS;
        }
        let weeklyPrices = this.weeklyPricesPerMonth[month];
        let slot = 0;
        for(let i=0; i<DISPLAY_MONTHS; ++i) {
            for(let j=0, numSlots=weeklyPrices.length; j<numSlots; ++j) {
                this.setShareWeeklyPrice(slot++, weeklyPrices[j]);
            }
            if(++month > MONTHS.DECEMBER) {
                month = MONTHS.JANUARY;
            }
            weeklyPrices = this.weeklyPricesPerMonth[month];
        }
    }

    updateSceneWeekly() {
        let increment = this.rotSpeed < 0 ? 2 : -2;
        let month = this.currentMonthWeekly + increment;
        if(month >= NUM_MONTHS) {
            month -= NUM_MONTHS;
        }
        if(month < 0) {
            month += NUM_MONTHS;
        }
        let data = this.weeklyPricesPerMonth[month];

        let segment = this.facingSegment + increment;
        if(segment >= NUM_SEGMENTS) {
            segment -= NUM_SEGMENTS;
        }
        if(segment < 0) {
            segment += NUM_SEGMENTS;
        }

        this.setShareWeeklyPriceSegment(segment, data);
        $('#month').html(this.data[this.currentMonthWeekly].month);
    }

    clearBlocks() {
        //Set all materials and scales for blocks
        for(let block=0, numBlocks=this.columns.length; block<numBlocks; ++block) {
            this.columns[block].material = this.spindleMat;
            this.columns[block].scale.set(1, 1, 1);
            this.columns[block].position.y = 0.5;
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

    setShareWeeklyPriceSegment(segment, data) {
        let block = segment * NUM_COLUMNS_PER_SEGMENT;
        for(let i=0; i<data.length; ++i) {
            this.setShareWeeklyPrice(block + i, data[i]);
        }
    }

    getShareText(block) {
        let prices = this.weeklyView ? this.realWeeklyPricesPerMonth[this.currentMonthWeekly] :
            this.realDailyPricesPerMonth[this.currentMonthDaily];

        let start = 0;
        if(!this.weeklyView) {
            start = this.data[this.currentMonthDaily].startSlot;
            block -= start;
            if(block <0) {
                return "No Data";
            }
        } else {
            block = block % NUM_COLUMNS_PER_SEGMENT;
        }
        return prices[block];
    }

    getBlockPosition(segment, position, radius) {
        //Get block number
        let block = (segment * this.DIVS_PER_SEGMENT) + position;
        let rot = (block - this.SEG_OFFSET) * this.DIV_ROT_INC;
        let posX = radius * Math.sin(rot);
        let posY = 0;
        let posZ = radius * Math.cos(rot);
        return new THREE.Vector3(posX, posY, posZ);
    }

    getBlockHeight(block) {
        let columns = this.weeklyView ? this.weeklyColumns : this.columns;
        let currentBlock = columns[block];
        return currentBlock.position.y;
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
                if(this.weeklyView) {
                    this.updateSceneWeekly();
                }
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
                    this.updateSceneDaily();
                    this.MOVE_INC *= -1;
                    this.moveSpeed = this.MOVE_INC / this.SCENE_MOVE_TIME;
                } else {
                    this.sceneMoving = false;
                    this.MOVE_INC *= -1;
                    this.moveSpeed = MOVE_SPEED;
                    this.showPriceLabels(this.showPrices);
                }
            }
        }

        if(this.viewMoving) {
            this.moveTime += delta;
            this.root.position.x += (this.moveSpeed * delta);
            if(this.moveTime >= this.SCENE_MOVE_TIME) {
                this.root.position.x = this.sceneMoveEnd;
                this.moveTime = 0;
                this.viewMoving = false;
                this.moveSpeed = MOVE_SPEED;
                this.changeViews();
            }
        }

        if(this.zoomingOut) {
            this.root.position.z -= this.moveSpeed * delta;
        }

        if(this.zoomingIn) {
            this.root.position.z += this.moveSpeed * delta;
        }

        this.currentLabel.setVisibility(false);
        if(this.hoverObjects.length && !this.showPrices) {
            let text = this.hoverObjects[0].object.name;
            //DEBUG
            //console.log("Hovered over ", text);

            if(text.indexOf("Block") < 0) return;

            let index = text.match(/\d+$/);
            index = index.join("");
            index = parseInt(index);
            if(isNaN(index)) {
                return;
            }

            text = this.getShareText(index);
            if(text === undefined) text = "No data";
            this.currentLabel.setWorldPosition(this.hoverObjects[0].object.matrixWorld);
            let height = this.getBlockHeight(index);
            this.currentLabel.offsetY(height + 6);
            this.currentLabel.setVisibility(true);
            this.currentLabel.setText(text);
        }
    }

    previousSegment() {
        //Move to previous segment
        if(this.sceneRotating || this.sceneMoving || this.viewMoving) return;

        this.rotateGroup = this.weeklyView ? this.parentGroupWeekly : this.parentGroupDaily;
        this.rotSpeed = this.ROT_INC_DAILY / this.SCENE_ROTATE_TIME;
        this.sceneRotEnd = this.rotateGroup.rotation.y + this.ROT_INC_DAILY;
        if(--this.currentWeek < 0) this.currentWeek = DATES.WEEKS_PER_MONTH;
        this.sceneRotating = true;

        if(this.weeklyView) {
            if(--this.facingSegment < 0) {
                this.facingSegment = NUM_SEGMENTS - 1;
            }
        }

        let showWeek = this.currentWeek + 1;
        $('#week').html(showWeek);
    }

    nextSegment() {
        //Move to next segment
        if(this.sceneRotating || this.sceneMoving || this.viewMoving) return;

        this.rotSpeed = -this.ROT_INC_DAILY / this.SCENE_ROTATE_TIME;
        this.rotateGroup = this.weeklyView ? this.parentGroupWeekly : this.parentGroupDaily;
        this.sceneRotEnd = this.rotateGroup.rotation.y - this.ROT_INC_DAILY;
        if(++this.currentWeek > DATES.WEEKS_PER_MONTH) this.currentWeek = 0;
        this.sceneRotating = true;

        if(this.weeklyView) {
            if(++this.facingSegment >= NUM_SEGMENTS) {
                this.facingSegment = 0;
            }
        }

        let showWeek = this.currentWeek + 1;
        $('#week').html(showWeek);
    }

    nextMonth() {
        //Animate to show next month
        if(this.sceneRotating || this.sceneMoving || this.viewMoving) return;

        if(this.weeklyView) {
            ++this.currentMonthWeekly;
            if(this.currentMonthWeekly > MONTHS.DECEMBER) this.currentMonthWeekly = MONTHS.JANUARY;
            this.showPriceLabels(this.showPrices);
            this.nextSegment();
            return;
        }

        ++this.currentMonthDaily;
        if(this.currentMonthDaily > MONTHS.DECEMBER) this.currentMonthDaily = MONTHS.JANUARY;

        this.moveSpeed = this.MOVE_INC / this.SCENE_MOVE_TIME;
        this.sceneMoveEnd = this.parentGroupDaily.position.y + this.MOVE_INC;
        this.sceneMoving = true;
        this.updateDateLabels();
    }

    previousMonth() {
        //Animate to show next month
        if(this.sceneRotating || this.sceneMoving || this.viewMoving) return;

        if(this.weeklyView) {
            --this.currentMonthWeekly;
            if(this.currentMonthWeekly < MONTHS.JANUARY) this.currentMonthWeekly = MONTHS.DECEMBER;
            this.previousSegment();
            return;
        }

        --this.currentMonthDaily;
        if(this.currentMonthDaily < MONTHS.JANUARY) this.currentMonthDaily = MONTHS.DECEMBER;
        this.moveSpeed = this.MOVE_INC / this.SCENE_MOVE_TIME;
        this.sceneMoveEnd = this.parentGroupDaily.position.y + this.MOVE_INC;
        this.sceneMoving = true;
        this.updateDateLabels();
    }

    toggleView() {
        if(this.sceneRotating || this.sceneMoving || this.viewMoving) return;

        this.viewMoving = true;
        this.weeklyView = !this.weeklyView;
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
        let month = this.weeklyView ? this.currentMonthWeekly : this.currentMonthDaily;
        $('#month').html(this.data[month].month);
    }

    moveToView() {
        let distance = this.VIEW_MOVE_INC;
        this.moveSpeed = this.VIEW_MOVE_INC / this.SCENE_MOVE_TIME;
        this.moveSpeed *= this.weeklyView ? -1 : 1;
        distance *= this.weeklyView ? -1 : 1;
        this.sceneMoveEnd = this.root.position.x + distance;
    }

    zoomOut(zoom) {
        this.zoomingOut = zoom;
    }

    zoomIn(zoom) {
        this.zoomingIn = zoom;
    }

    displayMessage(msg) {
        $('#content').html(msg);
        $('#message').show();
        setTimeout( () => {
            $('#message').hide();
        }, this.messageTimer);
    }

    stopNotifications(elemList) {
        for(let i=0, numElems=elemList.length; i<numElems; ++i) {
            $('#' + elemList[i]).contextmenu(() => {
                return false;
            });
        }
    }
}

$(document).ready( () => {
    if(!Detector.webgl) {
        $('#notSupported').show();
        return;
    }

    if(window.innerWidth < MOBILE_WIDTH) {
        $('#mainModal').modal();
    }

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

    let zoomOutElement = $('#zoomOut');
    let zoomInElement = $('#zoomIn');
    zoomOutElement.on("mousedown", () => {
        app.zoomOut(true);
    });

    zoomOutElement.on("mouseup", () => {
        app.zoomOut(false);
    });

    zoomOutElement.on("touchstart", () => {
        app.zoomOut(true);
    });

    zoomOutElement.on("touchend", () => {
        app.zoomOut(false);
    });

    zoomInElement.on("mousedown", () => {
        app.zoomIn(true);
    });

    zoomInElement.on("mouseup", () => {
        app.zoomIn(false);
    });

    zoomInElement.on("touchstart", () => {
        app.zoomIn(true);
    });

    zoomInElement.on("touchend", () => {
        app.zoomIn(false);
    });

    $('#instructions').on("click", () => {
        $('#myModal').modal();
    });

    let elemList = ["dateControls", "info", "instructions"];
    app.stopNotifications(elemList);

    app.run();

});
