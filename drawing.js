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

class SceneEntity {

}

class Scene {

    constructor(entities) {
        this.entities = entities;
    }

    draw(ctx) {

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
        return this.img.width;
    }

    getHeight() {
        return this.img.height;
    }

    getEndpoints(offset) {
        // return this.img.endpoints;
        return [];
    }

    draw(ctx, offset) {
        ctx.fillText(this.resistance, offset[0], offset[1] + 7);
        ctx.drawImage(img, offset[0], offset[1]);
    }
}

class ResistorDrawingGroup {
    constructor(group, type, gap) {
        this.group = group;
        this.type = type;
        this.gap = gap;
    }

    draw(ctx, offset) {
        let gOffset = [0, 0];
        if (!!offset) {
            gOffset = [...offset];
        }
        for (let obj of this.group) {
            if (this.type == "+") {
                let height = this.getHeight();
                gOffset[1] = (height - obj.getHeight()) / 2;
                obj.draw(ctx, gOffset);
                gOffset[0] += obj.getWidth() + this.gap;
            } else if (this.type == "||") {
                let width = this.getWidth();
                gOffset[0] = (width - obj.getWidth()) / 2;
                obj.draw(ctx, gOffset);
                gOffset[1] += obj.getHeight();
            }
        }
    }

    getWidth() {
        let widths = this.group.map(e => e.getWidth());
        if (this.type == "+") {
            let sumWidth = widths.reduce( (a, b) => a + b);
            return sumWidth + this.gap * (this.group.length + 1);
        } else if (this.type == "||" ) {
            let maxWidth = widths.reduce( (a, b) => Math.max(a,b));
            return maxWidth + this.gap * 2;
        }
    }

    getHeight() {
        let heights = this.group.map(e => e.getHeight());
        if (this.type == "+") {
            let maxHeight = heights.reduce( (a, b) => Math.max(a,b));
            return maxHeight;
        } else if (this.type == "||" ) {
            let sumHeight = heights.reduce( (a, b) => a + b);
            return sumHeight;
        }
    }
}

function drawResistorSpec(resistorSpec, resistorImg) {
    let stack = [];
    for (let o of resistorSpec) {
        if (o === "+") {
            if (stack.length <= 1) {
                continue;
            } else {
                let s = new ResistorDrawingGroup(stack, type="+", gap=0.0);
                stack = [s];
            }
        } else if (o === "||") {
            if (stack.length <= 1) {
                continue;
            } else {
                let s = new ResistorDrawingGroup(stack, type="||", gap=0.0);
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
