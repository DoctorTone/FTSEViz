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

        //Main spindle
        let parent = new THREE.Object3D();
        let geom = new THREE.CylinderBufferGeometry(CENTRE_RADIUS, CENTRE_RADIUS, CENTRE_HEIGHT, SEGMENTS);
        let spindleMat = new THREE.MeshLambertMaterial({color: 0xFFFB37});
        let spindle = new THREE.Mesh(geom, spindleMat);
        spindle.position.y += CENTRE_HEIGHT/2;
        parent.add(spindle);
        this.addToScene(parent);

        //Walls
        let i, wall, wallGroup;
        const WALL_OPACITY = 0.25;
        let wallMat = new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opacity: WALL_OPACITY});
        geom = new THREE.BoxBufferGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, SEGMENTS, SEGMENTS);
        for(i=0; i<NUM_WALLS; ++i) {
            wall = new THREE.Mesh(geom, wallMat);
            wallGroup = new THREE.Object3D();
            wallGroup.rotation.y = (this.ROT_INC*(i + 1)) + this.ROT_INC/2;
            wall.position.set(0, WALL_HEIGHT/2, WALL_DEPTH/2);
            wallGroup.add(wall);
            parent.add(wallGroup);
        }

        //Data blocks
        const BLOCK_HEIGHT = 50;
        const BLOCK_WIDTH_DEPTH = 7;
        let block;
        const NUM_SEGMENTS = 5;
        const NUM_BLOCKS_PER_SEGMENT = 5;
        geom = new THREE.BoxBufferGeometry(BLOCK_WIDTH_DEPTH, BLOCK_HEIGHT, BLOCK_WIDTH_DEPTH, SEGMENTS, SEGMENTS);
        let segment;
        for(segment=0; segment<NUM_SEGMENTS; ++segment) {
            for(i=0; i<NUM_BLOCKS_PER_SEGMENT; ++i) {
                block = new THREE.Mesh(geom, spindleMat);
                block.position.copy(this.getBlockPosition(segment, i));
                block.position.y += BLOCK_HEIGHT/2;
                parent.add(block);
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
    }

    previousSegment() {
        //Move to previous segment
        this.parentGroup.rotation.y -= this.ROT_INC/3;
    }

    nextSegment() {
        //Move to next segment
        this.parentGroup.rotation.y += this.ROT_INC/3;
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
