function parseResistorSpec(resistorSpec) {
    let stack = [];
    for (let o of resistorSpec) {
        if (o === "+") {
            if (stack.length <= 1) {
                continue;
            } else {
                let s = "(" + stack.join("+") + ")";
                stack = [s];
            }
        } else if (o === "||") {
            if (stack.length <= 1) {
                continue;
            } else {
                let s = "(" + stack.join("||") + ")";
                stack = [s];
            }
        } else {
            // assume type float
            stack.push(o);
        }
    }
    if (stack.length == 1) {
        return stack[0];
    } else {
        throw new Error("Invalid stack!");
    }
}

class ResistorImage {
    constructor(img, endpoints) {
        this.img = img;
        this.height = img.height;
        this.width = img.width;
        this.endpoints = endpoints;
    }
}

class ResistorDrawing {
    constructor(img, resistance) {
        this.img = img;
        this.resistance = `${resistance}Ω`;
    }

    getWidth() {
        if (!!this.img) {
            return this.img.width;
        }
        return 0;
    }

    getHeight() {
        if (!!this.img) {
            return this.img.height;
        }
        return 0;
    }

    getEndpoints(offset) {
        return this.img.endpoints;
        //return [];
    }

    draw(ctx, offset) {
        ctx.fillText(this.resistance, offset[0] + 
            (2/12) * this.img.width, offset[1] + (2/8) * this.img.height);
        ctx.drawImage(img, offset[0], offset[1]);
    }
}

class SeriesDrawingGroup {
    constructor(group, gap) {
        this.group = group;
        this.gap = gap;
    }

    getWidth() {
        let widths = this.group.map(e => e.getWidth());
        let sumWidth = widths.reduce( (a, b) => a + b);
        return sumWidth + this.gap * (this.group.length + 1);
    }

    getHeight() {
        let heights = this.group.map(e => e.getHeight());
        let maxHeight = heights.reduce( (a, b) => Math.max(a,b));
        return maxHeight;
    }

    getEndpoints() {
        let endpoints = {};
        let group = this.group;

        let width = this.getWidth();
        let leftBeginning = this.group[0].getEndpoints().left;
        let leftWidth = this.group[0].getWidth();
        endpoints['left'] = {
            x: leftBeginning['x'] * (leftWidth / width),
            y: 1/2
        };

        let rightBeginning = group[group.length - 1].getEndpoints().right;
        let rightWidth = group[group.length - 1].getWidth();
        endpoints['right'] = {
            x: ((width - (1 - rightBeginning['x']) * rightWidth)/width),
            y: 1/2
        };

        return endpoints;
    }

    draw(ctx, offset) {
        let gOffset = [0, 0];
        if (!!offset) {
            gOffset = [...offset];
        }
        let gOffsetInitial = [...gOffset];
        let endpoints = this.getEndpoints();
        let curEndpoints = this.group[0].getEndpoints();

        let height = this.getHeight();
        let width = this.getWidth();

        let curLeftX = gOffset[0]
            + curEndpoints['left']['x'] * this.group[0].getWidth();
        let curLeftY = gOffset[1]
            + curEndpoints['left']['y'] * this.group[0].getWidth();
        let curRightX;
        let curRightY;
        
        for (let obj of this.group) {
            let objEndpoints = obj.getEndpoints();

            let objWidth = obj.getWidth();
            let objHeight = obj.getHeight();


            gOffset[1] = gOffsetInitial[1] + (height - obj.getHeight()) / 2;

            curLeftX = (gOffset[0] + objEndpoints['left']['x'] * objWidth);
            curLeftY = (gOffset[1] + objEndpoints['left']['y'] * objHeight);

            if (!!curRightX && !!curRightY) {
                ctx.beginPath();

                ctx.moveTo(curLeftX, curLeftY);
                ctx.lineTo(curRightX, curRightY); // previous right endpoint

                ctx.stroke();
            }
            curRightX = gOffset[0] + objEndpoints['right']['x'] * objWidth;
            curRightY = gOffset[1] + objEndpoints['right']['y'] * objHeight;

            obj.draw(ctx, gOffset);
            gOffset[0] += obj.getWidth() + this.gap;
        } 
    }
}

class ParallelDrawingGroup {
    constructor(group, gap) {
        this.group = group;
        this.gap = gap;
    }

    getWidth() {
        let widths = this.group.map(e => e.getWidth());
        let maxWidth = widths.reduce( (a, b) => Math.max(a,b));
        return maxWidth + this.gap * 2;
    }

    getHeight() {
        let heights = this.group.map(e => e.getHeight());
        let sumHeight = heights.reduce( (a, b) => a + b);
        return sumHeight;
    }

    getEndpoints() {
        let maxWidthObj = new ResistorDrawing();
        for (let obj of this.group) {
            if (obj.getWidth() > maxWidthObj.getWidth()) {
                maxWidthObj = obj;
            }
        }

        return {
            left: {
                x: maxWidthObj.getEndpoints()['left']['x'],
                y: 1/2
            },
            right: {
                x: maxWidthObj.getEndpoints()['right']['x'],
                y: 1/2
            }
        }
    }

    draw(ctx, offset) {
        let gOffset = [0, 0];
        if (!!offset) {
            gOffset = [...offset];
        }

        let gOffsetInitial = [...gOffset];
        let endpoints = this.getEndpoints();

        let height = this.getHeight();
        let width = this.getWidth();

        let leftX = offset[0] + endpoints['left'].x * width;
        let rightX = offset[0] + endpoints['right'].x * width;

        let initObj = this.group[0];
        let initEndpoints = initObj.getEndpoints();

        let curLeftX = gOffset[0]
            + initEndpoints['left']['x'] * initObj.getWidth();
        let curLeftY = gOffset[1]
            + initEndpoints['left']['y'] * initObj.getWidth();
        let curRightX = gOffset[0]
            + initEndpoints['right']['x'] * initObj.getWidth();
        let curRightY = gOffset[1]
            + initEndpoints['right']['y'] * initObj.getWidth();

        for (let obj of this.group) {
            let objEndpoints = obj.getEndpoints();

            let objWidth = obj.getWidth();
            let objHeight = obj.getHeight();

            gOffset[0] = gOffsetInitial[0] + (width - objWidth) / 2;

            curLeftX = (gOffset[0] + objEndpoints['left']['x'] * objWidth);
            curLeftY = (gOffset[1] + objEndpoints['left']['y'] * objHeight);
            ctx.beginPath();
            ctx.moveTo(curLeftX, curLeftY);
            ctx.lineTo(leftX, curLeftY);
            ctx.stroke();

            curRightX = (gOffset[0] + objEndpoints['right']['x'] * objWidth);
            curRightY = (gOffset[1] + objEndpoints['right']['y'] * objHeight);
            ctx.beginPath();
            ctx.moveTo(curRightX, curRightY);
            ctx.lineTo(rightX, curRightY);
            ctx.stroke();

            obj.draw(ctx, gOffset);
            gOffset[1] += objHeight;
        }

        let firstY = gOffsetInitial[1] + initEndpoints['left']['y'] 
            * initObj.getHeight();

        let lastObj = this.group[this.group.length - 1];
        let lastY = curLeftY;

        ctx.beginPath();
        ctx.moveTo(leftX, lastY);
        ctx.lineTo(leftX, firstY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(rightX, lastY);
        ctx.lineTo(rightX, firstY);
        ctx.stroke();
    }
}

function drawResistorSpec(resistorSpec, resistorImg) {
    let stack = [];
    for (let o of resistorSpec) {
        if (typeof(o) === typeof([])) {
            stack.push(drawResistorSpec(o, resistorImg));
        } else if (o === "+") {
            if (stack.length <= 1) {
                continue;
            } else {
                let s = new SeriesDrawingGroup(stack, gap=0.0);
                stack = [s];
            }
        } else if (o === "||") {
            if (stack.length <= 1) {
                continue;
            } else {
                let s = new ParallelDrawingGroup(stack, gap=0.0);
                stack = [s];
            }
        } else {
            // assume type float
            stack.push(new ResistorDrawing(resistorImg, o));
        }
    }
    if (stack.length == 1) {
        return stack[0];
    } else {
        throw new Error("Invalid stack!");
    }
}
