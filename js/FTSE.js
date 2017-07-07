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
        const CENTRE_HEIGHT = 60;
        const CENTRE_RADIUS = 5;
        const SEGMENTS = 16;
        const WALL_HEIGHT = 60;
        const WALL_DEPTH = 120;
        const WALL_WIDTH = 5;
        const NUM_WALLS = 5;
        this.WALL_RADIUS = WALL_DEPTH;
        this.DIVS_PER_SEGMENT = 6;
        this.ROT_INC = (Math.PI * 2)/NUM_WALLS;
        this.DIV_ROT_INC = this.ROT_INC/this.DIVS_PER_SEGMENT;
        this.SEG_OFFSET = 2;
        this.SCENE_ROTATE_TIME = 2;
        this.sceneRotating = false;
        this.sceneRotStart = 0;
        this.sceneRotEnd = 0;
        this.rotSpeed = 0;
        this.rotationTime = 0;
        this.BLOCKS_PER_SEGMENT = 5;
        this.NUM_SEGMENTS = 5;
        this.NUM_BLOCKS = this.NUM_SEGMENTS * this.BLOCKS_PER_SEGMENT;

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
        const WALL_OPACITY = 0.25;
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
        const COLUMN_HEIGHT = 50;
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
        dataLoad.load("data/ftseJan2009.json", data => {
            this.data = data;
            this.updateScene();
        });
    }

    addGround() {
        //Ground plane
        const GROUND_WIDTH = 1000, GROUND_HEIGHT = 640, SEGMENTS = 16;
        let groundGeom = new THREE.PlaneBufferGeometry(GROUND_WIDTH, GROUND_HEIGHT, SEGMENTS, SEGMENTS);
        let groundMat = new THREE.MeshLambertMaterial( {color: 0x5286FF} );
        let ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI/2;
        this.addToScene(ground);
    }

    updateScene() {
        //Grey out unused blocks
        let i, start = this.data.startSlot, end = this.data.endSlot;
        if(start > 0) {
            for(i=0; i<start; ++i) {
                this.disableBlock(i);
            }
        }
        if(end < (this.BLOCKS_PER_SEGMENT - 1)) {
            let segment = 4;
            for(i = segment * this.BLOCKS_PER_SEGMENT; i<this.NUM_BLOCKS; ++i) {
                this.disableBlock(i);
            }
        }

        let numShares = this.data.shares.length + start;
        let currentPrice;
        const CLOSE_PRICE = 2;
        for(i=0; i<numShares; ++i) {
            currentPrice = this.data.shares[i];
            this.setSharePrice(i+start, currentPrice[CLOSE_PRICE]);
        }
    }

    disableBlock(blockNumber) {
        //Grey out given block number
        this.columns[blockNumber].material = this.spindleMatDisabled;
    }

    setSharePrice(block, price) {
        //Scale price to reasonable size
        const SCALE_FACTOR = 1000;
        this.columns[block].scale.set(1, price/SCALE_FACTOR, 1);
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
            this.rotationTime += delta;
            this.parentGroup.rotation.y += (this.rotSpeed * delta);
            if(this.rotationTime >= this.SCENE_ROTATE_TIME) {
                this.parentGroup.rotation.y = this.sceneRotEnd;
                this.rotationTime = 0;
                this.sceneRotating = false;
            }
        }
    }

    previousSegment() {
        //Move to previous segment
        if(this.sceneRotating) return;
        this.rotSpeed = -this.ROT_INC / this.SCENE_ROTATE_TIME;
        this.sceneRotEnd = this.parentGroup.rotation.y - this.ROT_INC;
        this.sceneRotating = true;
    }

    nextSegment() {
        //Move to next segment
        if(this.sceneRotating) return;
        this.rotSpeed = this.ROT_INC / this.SCENE_ROTATE_TIME;
        this.sceneRotEnd = this.parentGroup.rotation.y + this.ROT_INC;
        this.sceneRotating = true;
    }
}

$(document).ready( () => {
    let container = document.getElementById("WebGL-output");
    let app = new FTSEApp();
    app.init(container);
    //app.createGUI();
    app.createScene();

    $('#previous').on("click", () => {
        app.previousSegment();
    });

    $('#next').on("click", () => {
        app.nextSegment();
    });

    app.run();

});
