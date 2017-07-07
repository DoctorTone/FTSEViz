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

        //Main spindle
        let parent = new THREE.Object3D();
        let cylinderGeom = new THREE.CylinderBufferGeometry(CENTRE_RADIUS, CENTRE_RADIUS, CENTRE_HEIGHT, SEGMENTS);
        let spindleMat = new THREE.MeshLambertMaterial({color: 0xFFFB37});
        let spindle = new THREE.Mesh(cylinderGeom, spindleMat);
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
        for(segment=0; segment<NUM_SEGMENTS; ++segment) {
            for(i=0; i<NUM_COLUMNS_PER_SEGMENT; ++i) {
                column = new THREE.Mesh(cylinderGeom, spindleMat);
                column.position.copy(this.getBlockPosition(segment, i));
                column.position.y += COLUMN_HEIGHT/2;
                parent.add(column);
            }
        }

        this.parentGroup = parent;
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
        this.rotSpeed = -this.ROT_INC / this.SCENE_ROTATE_TIME;
        this.sceneRotEnd = this.parentGroup.rotation.y - this.ROT_INC;
        this.sceneRotating = true;
    }

    nextSegment() {
        //Move to next segment
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
