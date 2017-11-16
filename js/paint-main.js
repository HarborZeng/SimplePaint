var myCanvas = (function () {
    return document.getElementById('myCanvas');
})();
/**
 * 原地调用初始化canvas和context对象
 * @return context canvas的context对象
 */
var context = (function () {
    myCanvas.width = window.innerWidth - 80;
    myCanvas.height = window.innerHeight - 50;
    return myCanvas.getContext('2d');
})();

/**
 * imageStack是我们在undo的时候的依据，
 * 在undo的时候，会把imageStack给pop一下，
 * 然后遍历输出imageStack以实现undo操作
 * @type {Array}
 */
var imageStack = [];

//↓↓↓↓↓↓↓↓↓↓Menu父类定义begins↓↓↓↓↓↓↓↓↓↓
/**
 * 菜单对象的父类
 * @constructor 空
 */
function Menu() {
}

/**
 * 给菜单对象添加原形name
 * @type {string} name的值
 */
Menu.prototype.name = 'menu';
/**
 * 给菜单对象添加原形items
 * @type {{default_item: string}}
 * 是一个列表对象，代表
 */
Menu.prototype.items = {
    default_item: ''
};
Menu.prototype.getCurrent = function () {
    return this.items.default_item;
};
Menu.prototype.setCurrent = function (selection) {
    this.items.default_item = selection;
};
Menu.prototype.getItems = function () {
    return this.items;
};
Menu.prototype.menuItemSelected = function (selection) {
    this.setCurrent(selection);
};
Menu.prototype.toString = function () {
    return this.name + ' has ' + this.items;
};

//↑↑↑↑↑↑↑↑↑↑↑↑Menu父类定义ends↑↑↑↑↑↑↑↑↑↑↑↑


/**
 * extend函数用来模拟继承，解决子对象和父对象指向同一个对象，
 * 子对象修改原型，父对象也会被修改的不足之处
 * @param Child 子类
 * @param Parent 父类
 */
function extend(Child, Parent) {
    var F = function () {
    };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.uber = Parent.prototype;
}

//↓↓↓↓↓↓↓↓↓↓ShapeMenu子类定义begins↓↓↓↓↓↓↓↓↓↓
function ShapeMenu() {
}

extend(ShapeMenu, Menu);

ShapeMenu.prototype.name = 'shape menu';
ShapeMenu.prototype.items = {
    curve: 'curve-shape',
    line: 'line-shape',
    circle: 'circle-shape',
    oval: 'oval-shape',
    rectangle: 'rectangle-shape',
    element: 'element-shape',
    default_item: 'curve-shape'
};
//↑↑↑↑↑↑↑↑↑↑↑↑ShapeMenu子类定义ends↑↑↑↑↑↑↑↑↑↑↑↑

//↓↓↓↓↓↓↓↓↓↓PenType子类定义begins↓↓↓↓↓↓↓↓↓↓
function PenTypeMenu() {
}

extend(PenTypeMenu, Menu);

PenTypeMenu.prototype.name = 'Pen Type Menu';
PenTypeMenu.prototype.items = {
    veryThin: 'very_thin-pen',
    thin: 'thin-pen',
    normal: 'normal-pen',
    bold: 'bold-pen',
    veryBold: 'very_bold-pen',
    custom: 'custom-pen',
    default_item: 'normal-pen'
};
//↑↑↑↑↑↑↑↑↑↑↑↑PenTypeMenu子类定义ends↑↑↑↑↑↑↑↑↑↑↑↑

//↓↓↓↓↓↓PenColor子类定义begins↓↓↓↓↓↓
function PenColorMenu() {
}

extend(PenColorMenu, Menu);

PenColorMenu.prototype.name = 'Pen color Menu';
PenColorMenu.prototype.items = {
    blue: 'blue-pen_color',
    black: 'black-pen_color',
    purple: 'purple-pen_color',
    red: 'red-pen_color',
    green: 'green-pen_color',
    yellow: 'yellow-pen_color',
    white: 'white-pen_color',
    brown: 'brown-pen_color',
    pink: 'pink-pen_color',
    grey: 'grey-pen_color',
    customized: 'customized-pen_color',
    default_item: 'black-pen_color'
};
//↑↑↑↑↑↑↑PenColorMenu子类定义ends↑↑↑↑↑↑↑

//↓↓↓↓↓↓EraserMenu子类定义begins↓↓↓↓↓↓
function EraserMenu() {
}

extend(EraserMenu, Menu);

EraserMenu.prototype.name = 'Eraser Menu';
EraserMenu.prototype.items = {
    checked: 'checked',
    unchecked: '',
    default_item: ''
};

//↑↑↑↑↑↑↑↑EraserMenu子类定义ends↑↑↑↑↑↑↑↑


/**
 * 该序列化的方法，参考了这篇文章
 * https://juejin.im/entry/5876f23d128fe10057d55251
 * 在保存对象的时候，使用JSON是不可行的，原因是JSON对象不能保存函数
 * 而我的Shape实现类，全都有自身的draw函数，导致的结果就是还原的对象会丢失draw函数
 *
 * @param obj 需要被序列化的对象
 * @param name 需要被序列化的对象的名字，eg，imageStack，后期eval的时候，是赋值给name对象的
 **/
function serialize(obj, name) {
    var result = "";

    function serializeInternal(o, path) {
        for (var p in o) {
            var value = o[p];
            if (typeof value !== "object") {
                if (typeof value === "string") {
                    result += "\n" + path + "[" + (isNaN(p) ? "\"" + p + "\"" : p) + "] = " + "\"" + value.replace(/\"/g, "\\\"") + "\"" + ";";
                } else {
                    result += "\n" + path + "[" + (isNaN(p) ? "\"" + p + "\"" : p) + "] = " + value + ";";
                }
            }
            else {
                if (value instanceof Array) {
                    result += "\n" + path + "[" + (isNaN(p) ? "\"" + p + "\"" : p) + "]" + "=" + "new Array();";
                    serializeInternal(value, path + "[" + (isNaN(p) ? "\"" + p + "\"" : p) + "]");
                } else {
                    result += "\n" + path + "[" + (isNaN(p) ? "\"" + p + "\"" : p) + "]" + "=" + "new Object();";
                    serializeInternal(value, path + "[" + (isNaN(p) ? "\"" + p + "\"" : p) + "]");
                }
            }
        }
    }

    serializeInternal(obj, name);
    return result;
}

//↓↓↓↓↓↓点击事件类定义begins↓↓↓↓↓↓
function openSelected() {
    imageStack = [];
    //eval这段字符串，把保存的代码段执行，给imageStack初始化
    eval(localStorage.getItem('myCanvas'));
    drawShape();
}

function saveSelected() {
    var serializable = serialize(imageStack, 'imageStack');
    localStorage.setItem('myCanvas', serializable);
    alert('已保存');
}

function uncheckMenu(menu) {
    var items = menu.getItems();
    var keys = Object.keys(items);
    clearPreviousSelection(keys, items);
    menu.items.default_item = '';
}

/**
 * shapeSelected是一个在html代码中onclick定义的函数，
 * 使用事件传递的方式获取定位到事件源，将ShapeMenu对象
 * 里面的默认值改成点击的值，值就是id
 **/
function shapeSelected() {
    var shapeID = event.target.id;
    shapeMenu = new ShapeMenu();
    shapeMenu.menuItemSelected(shapeID);
    menuSelected(shapeMenu);
    uncheckMenu(eraserMenu);
}

/**
 * penTypeSelected是一个在html代码中onclick定义的函数，
 * 使用事件传递的方式获取定位到事件源，将PenTypeMenu对象
 * 里面的默认值改成点击的值，值就是id
 **/
function penTypeSelected() {
    var penTypeID = event.target.id;
    penTypeMenu = new PenTypeMenu();
    penTypeMenu.menuItemSelected(penTypeID);
    menuSelected(penTypeMenu);
}

/**
 * penColorSelected是一个在html代码中onclick定义的函数，
 * 使用事件传递的方式获取定位到事件源，将PenColorMenu对象
 * 里面的默认值改成点击的值，值就是id
 **/
function penColorSelected() {
    var penColorID = event.target.id;
    penColorMenu = new PenColorMenu();
    penColorMenu.menuItemSelected(penColorID);
    menuSelected(penColorMenu);
}

/**
 * eraserSelected是一个在html代码中onclick定义的函数，
 * 使用事件传递的方式获取定位到事件源，将EraserMenu对象
 * 里面的默认值改成点击的值，值就是id
 **/
function eraserSelected() {
    eraserMenu = new EraserMenu();
    eraserMenu.menuItemSelected(eraserMenu.items.checked);
    menuSelected(eraserMenu);
    uncheckMenu(shapeMenu);
}

//↑↑↑↑↑↑↑↑↑点击事件类定义ends↑↑↑↑↑↑↑↑↑


/**
 * 该函数为shapeSelected，penTypeSelected，penColorSelected和
 * eraserSelected函数内部的共同调用
 *
 * 主要作用为清除之前的选择，给新的选择加特效
 *
 * @param menu 点击的那个需要加特效的菜单项的母菜单
 **/
function menuSelected(menu) {
    var items = menu.getItems();
    var keys = Object.keys(items);
    clearPreviousSelection(keys, items);

    var selectedID = menu.getCurrent();
    var selection = document.getElementById(selectedID);
    if (selection !== null) {
        selection.style.color = '#548248';
        selection.style.background = '#333';
        selection.style.fontWeight = 'bold';
    }
}

/**
 * 清除之前的选择
 *
 * @param keys 选中的那个菜单项对应的母菜单下所有的菜单项的ID组成的数组
 *             的‘键’集合
 * @param items 选中的那个菜单项对应的母菜单下所有的菜单项的ID组成的数组
 **/
function clearPreviousSelection(keys, items) {
    for (var i = 0; i < keys.length; i++) {
        var id = document.getElementById(items[keys[i]]);
        if (id !== null) {
            id.style.color = '#b7b7b7';
            id.style.background = '#222';
            id.style.fontWeight = 'normal';
        }
    }
}

/**
 * 四个全局的变量，代表四个主要的菜单对象
 **/
var shapeMenu;
var penTypeMenu;
var penColorMenu;
var eraserMenu;

/**
 * 初始化菜单的默认选择
 */
(function initSelection() {
    shapeMenu = new ShapeMenu();
    menuSelected(shapeMenu);
    penTypeMenu = new PenTypeMenu();
    menuSelected(penTypeMenu);
    penColorMenu = new PenColorMenu();
    menuSelected(penColorMenu);
    eraserMenu = new EraserMenu();
    menuSelected(eraserMenu);
})();


/**
 *Shape为所有绘制的图形的父类，存放了子类都有的变量
 * @param originalX 记录绘制当前图形的originalX
 * @param originalY 记录绘制当前图形的originalY
 * @param nowX 记录绘制当前图形的nowX
 * @param nowY 记录绘制当前图形的nowY
 * @param lineWidth 记录绘制当前图形的lineWidth
 * @param lineColor 记录绘制当前图形的strokeColor
 * @param name 记录绘制当前图形的名字代号
 * @constructor
 */
function Shape(originalX, originalY, nowX, nowY, lineWidth, lineColor, name) {
    this.originalX = originalX;
    this.originalY = originalY;
    this.nowX = nowX;
    this.nowY = nowY;
    this.lineWidth = lineWidth;
    this.lineColor = lineColor;
    this.name = name;
}

Shape.prototype.draw = function () {
};

//↑↑↑↑↑↑↑↑↑↑↑↑Shape父类定义ends↑↑↑↑↑↑↑↑↑↑↑↑

/**
 * 直线对象的定义，其构造函数完全复用父类
 * @param originalX 记录绘制当前图形的originalX
 * @param originalY 记录绘制当前图形的originalY
 * @param nowX 记录绘制当前图形的nowX
 * @param nowY 记录绘制当前图形的nowY
 * @param lineWidth 记录绘制当前图形的lineWidth
 * @param lineColor 记录绘制当前图形的strokeColor
 * @param name 记录绘制当前图形的名字代号
 * @constructor
 */
function Line(originalX, originalY, nowX, nowY, lineWidth, lineColor, name) {
    Shape.call(this, originalX, originalY, nowX, nowY, lineWidth, lineColor, name);
}

extend(Line, Shape);

Line.prototype.draw = function () {
    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.lineColor;
    context.beginPath();
    context.moveTo(this.originalX, this.originalY);
    context.lineTo(this.nowX, this.nowY);
    context.stroke();
    context.closePath();
};

/**
 * 矩形对象的定义，其构造函数完全复用父类
 * @param originalX 记录绘制当前图形的originalX
 * @param originalY 记录绘制当前图形的originalY
 * @param nowX 记录绘制当前图形的nowX
 * @param nowY 记录绘制当前图形的nowY
 * @param lineWidth 记录绘制当前图形的lineWidth
 * @param lineColor 记录绘制当前图形的strokeColor
 * @param name 记录绘制当前图形的名字代号
 * @constructor
 */
function Rectangle(originalX, originalY, nowX, nowY, lineWidth, lineColor, name) {
    Shape.call(this, originalX, originalY, nowX, nowY, lineWidth, lineColor, name);
}

extend(Rectangle, Shape);
Rectangle.prototype.draw = function () {
    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.lineColor;
    context.strokeRect(this.originalX, this.originalY,
        this.nowX - this.originalX, this.nowY - this.originalY);
};

/**
 * 圆形对象的定义，其构造函数完全复用父类
 * @param originalX 记录绘制当前图形的originalX
 * @param originalY 记录绘制当前图形的originalY
 * @param nowX 记录绘制当前图形的nowX
 * @param nowY 记录绘制当前图形的nowY
 * @param lineWidth 记录绘制当前图形的lineWidth
 * @param lineColor 记录绘制当前图形的strokeColor
 * @param name 记录绘制当前图形的名字代号
 * @constructor
 */
function Circle(originalX, originalY, nowX, nowY, lineWidth, lineColor, name) {
    Shape.call(this, originalX, originalY, nowX, nowY, lineWidth, lineColor, name);
}

extend(Circle, Shape);
Circle.prototype.draw = function () {
    var radius = Math.sqrt(
        Math.pow(Math.abs(this.nowX - this.originalX) / 2, 2)
        + Math.pow(Math.abs(this.nowY - this.originalY) / 2, 2)
    );
    var centerX = this.originalX
        + (this.nowX - this.originalX) / 2;
    var centerY = this.originalY
        + (this.nowY - this.originalY) / 2;

    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.lineColor;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    context.stroke();
    context.closePath();
};

/**
 * 曲线对象的定义，曲线的微元就是直线
 * @param elementArray 数组里面包含若干个直线
 * @constructor
 */
function Curve(elementArray, name) {
    Shape.call(this, null, null, null, null, null, null, name);
    this.elementsArray = elementArray;
}

extend(Curve, Shape);

/**
 * Curve的draw方法就是遍历draw elementArray里面的每一个line
 **/
Curve.prototype.draw = function () {
    for (var i = 0; i < this.elementsArray.length; i++) {
        this.elementsArray[i].draw();
    }
};

/**
 * 椭圆对象的定义，其构造函数完全复用父类
 * @param originalX 记录绘制当前图形的originalX
 * @param originalY 记录绘制当前图形的originalY
 * @param nowX 记录绘制当前图形的nowX
 * @param nowY 记录绘制当前图形的nowY
 * @param lineWidth 记录绘制当前图形的lineWidth
 * @param lineColor 记录绘制当前图形的strokeColor
 * @param name 记录绘制当前图形的名字代号
 * @constructor
 */
function Oval(originalX, originalY, nowX, nowY, lineWidth, lineColor, name) {
    Shape.call(this, originalX, originalY, nowX, nowY, lineWidth, lineColor, name);
}

extend(Oval, Shape);
Oval.prototype.draw = function () {
    //实在不会了，参考了下面这篇博客
    //http://www.alloyteam.com/2015/07/canvas-hua-tuo-yuan-di-fang-fa/
    //的第一种方法，优点算法简单
    var centerX = this.originalX;
    var centerY = this.originalY;
    var height = this.nowY - this.originalY;
    var width = this.nowX - this.originalX;

    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.lineColor;

    context.beginPath();
    context.moveTo(centerX + width, centerY);
    for (var i = 0; i <= 2 * Math.PI; i += 1 / 800) {
        context.lineTo(centerX + width * Math.cos(i),
            centerY + height * Math.sin(i));
    }
    context.stroke();
    context.closePath();
};


/**
 * Element对象的定义，Element属于Curve的一部分，n个elements构成一个Curve
 * @param originalX 记录绘制当前图形的originalX
 * @param originalY 记录绘制当前图形的originalY
 * @param nowX 记录绘制当前图形的nowX
 * @param nowY 记录绘制当前图形的nowY
 * @param lastX 记录绘制当前图形的上一个坐标x
 * @param lastY 记录绘制当前图形的上一个坐标y
 * @param lineWidth 记录绘制当前图形的lineWidth
 * @param lineColor 记录绘制当前图形的strokeColor
 * @param name 记录绘制当前图形的名字代号
 * @constructor
 */
function Element(originalX, originalY, nowX, nowY, lastX, lastY, lineWidth, lineColor, name) {
    Shape.call(this, originalX, originalY, nowX, nowY, lineWidth, lineColor, name);
    this.lastX = lastX;
    this.lastY = lastY;
}

extend(Element, Shape);
Element.prototype.draw = function () {
    //行为和Line的draw一样
    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.lineColor;
    context.beginPath();
    context.moveTo(this.lastX, this.lastY);
    context.lineTo(this.nowX, this.nowY);
    context.stroke();
    context.closePath();
};

/**
 * 鼠标对象，使用较为广泛，属性在鼠标按下和移动的时候能被更新，
 * 内含数种鼠标状态和getter setter
 * @type {{originalX: number, originalY: number, nowX: number, nowY: number, mouseStatus: string, mouseStatusList: {down: string, up: string, notDefined: string}, setMouseStatusDown: mouse.setMouseStatusDown, setMouseStatusUp: mouse.setMouseStatusUp, getMouseStatus: mouse.getMouseStatus}}
 */
var mouse = {
    originalX: innerWidth / 2,
    originalY: innerHeight / 2,
    nowX: innerWidth / 2,
    nowY: innerHeight / 2,
    lastX: innerWidth / 2,
    lastY: innerHeight / 2,
    mouseStatus: 'not_defined',
    mouseStatusList: {
        down: 'down',
        up: 'up',
        notDefined: 'not_defined'
    },
    mouseWidth: 0,
    mouseColor: '#fff',
    setMouseStatusDown: function () {
        this.mouseStatus = this.mouseStatusList.down;
    },
    setMouseStatusUp: function () {
        this.mouseStatus = this.mouseStatusList.up;
    },
    getMouseStatus: function () {
        return this.mouseStatus;
    }
};

/**
 * erase函数是html代码里面undo的onclick事件
 */
function erase() {
    imageStack.pop();
    context.clearRect(0, 0, myCanvas.width, myCanvas.height);
    for (var i = 0; i < imageStack.length; i++) {
        imageStack[i].draw();
    }
    console.log(imageStack);
}


var curveArray = [];

/**
 * 鼠标按下的时候要执行的事情
 * @param event 系统级的变量event
 */
function myCanvasMouseDown(event) {
    console.log('mouse down');
    if (event.button === 0) {
        mouse.originalX = event.offsetX;
        mouse.lastX = event.offsetX;
        mouse.nowX = event.offsetX;
        mouse.originalY = event.offsetY;
        mouse.lastY = event.offsetY;
        mouse.nowY = event.offsetY;
        mouse.setMouseStatusDown();

        curveArray = [];
    }

    if (eraserMenu.getCurrent() === eraserMenu.items.unchecked) {
        //先拿到当前菜单上的颜色
        if (penColorMenu.getCurrent() === penColorMenu.items.customized) {
            mouse.mouseColor = document.getElementById('customized-pen_color').value;
        } else {
            mouse.mouseColor = penColorMenu.getCurrent()
                .substring(0, penColorMenu.getCurrent().indexOf('-'));
        }

        //再拿到当前菜单上的画笔粗细
        switch (penTypeMenu.getCurrent()) {
            case penTypeMenu.items.bold:
                mouse.mouseWidth = 10;
                break;
            case penTypeMenu.items.veryBold:
                mouse.mouseWidth = 20;
                break;
            case penTypeMenu.items.normal:
                mouse.mouseWidth = 5;
                break;
            case penTypeMenu.items.veryThin:
                mouse.mouseWidth = 1;
                break;
            case penTypeMenu.items.thin:
                mouse.mouseWidth = 3;
                break;
            case penTypeMenu.items.custom:
                mouse.mouseWidth = document.getElementById('custom-pen').value;
                break;
            default:
                console.warn('In myCanvasMouseMove choose pen type' +
                    ', went to default!!!');
        }
    } else {
        deleteShape();
    }
}

/**
 * 具体的执行画图的Controller
 */
function drawShape() {
    context.clearRect(0, 0, myCanvas.width, myCanvas.height);
    for (var i = 0; i < imageStack.length; i++) {
        imageStack[i].draw();
    }
    for (var j = 0; j < curveArray.length; j++) {
        curveArray[j].draw();
    }

    //最后拿到菜单上选择的当前画笔画什么样的图形，并new相应对象，执行draw方法
    switch (shapeMenu.getCurrent()) {
        case shapeMenu.items.circle:
            var circle = new Circle(mouse.originalX, mouse.originalY,
                mouse.nowX, mouse.nowY,
                mouse.mouseWidth, mouse.mouseColor,
                shapeMenu.items.circle);
            circle.draw();
            break;
        case shapeMenu.items.rectangle:
            var rectangle = new Rectangle(mouse.originalX, mouse.originalY,
                mouse.nowX, mouse.nowY,
                mouse.mouseWidth, mouse.mouseColor,
                shapeMenu.items.rectangle);
            rectangle.draw();
            break;
        case shapeMenu.items.line:
            var line = new Line(mouse.originalX, mouse.originalY,
                mouse.nowX, mouse.nowY,
                mouse.mouseWidth, mouse.mouseColor,
                shapeMenu.items.line);
            line.draw();
            break;
        case shapeMenu.items.curve:
            var element = new Element(mouse.originalX, mouse.originalY,
                mouse.nowX, mouse.nowY, mouse.lastX, mouse.lastY,
                mouse.mouseWidth, mouse.mouseColor,
                shapeMenu.items.element);
            element.draw();
            mouse.lastX = mouse.nowX;
            mouse.lastY = mouse.nowY;
            curveArray.push(element);
            break;
        case shapeMenu.items.oval:
            var oval = new Oval(mouse.originalX, mouse.originalY,
                mouse.nowX, mouse.nowY,
                mouse.mouseWidth, mouse.mouseColor,
                shapeMenu.items.oval);
            oval.draw();
            break;
        default:
            console.warn('In myCanvasMouseMove, went to default!!!' +
                'May using eraser now');
    }
}

function deleteShape() {
    //现在是橡皮擦状态
    if (context.getImageData(mouse.nowX, mouse.nowY, 1, 1).data[3] === 0) {
        //橡皮擦点击的地方是透明的，不做删除检测！！！ 提高性能，避免误删
        console.warn('橡皮擦点击的地方是透明的');
    } else {
        console.log(mouse.originalX, mouse.originalY);
        var deleteSucceed = false;
        for (var i = 0; i < imageStack.length; i++) {
            switch (imageStack[i].name) {
                case shapeMenu.items.curve:
                    for (var j = 0; j < imageStack[i].elementsArray.length; j++) {
                        var lastX = imageStack[i].elementsArray[j].lastX;
                        var lastY = imageStack[i].elementsArray[j].lastY;
                        var nowX = imageStack[i].elementsArray[j].nowX;
                        var nowY = imageStack[i].elementsArray[j].nowY;
                        if ((mouse.nowX >= lastX && mouse.nowX <= nowX &&
                                mouse.nowY >= lastY && mouse.nowY <= nowY) ||
                            (mouse.nowX >= nowX && mouse.nowX <= lastX &&
                                mouse.nowY >= nowY && mouse.nowY <= lastY) ||
                            (mouse.nowX <= nowX && mouse.nowX >= lastX &&
                                mouse.nowY >= nowY && mouse.nowY <= lastY) ||
                            (mouse.nowX <= lastX && mouse.nowX >= nowX &&
                                mouse.nowY >= lastY && mouse.nowY <= nowY)) {
                            imageStack.splice(i, 1);
                            deleteSucceed = true;
                            break;
                        }
                    }
                    break;
                case shapeMenu.items.line:
                    var originalX = imageStack[i].originalX;
                    var originalY = imageStack[i].originalY;
                    var nowX = imageStack[i].nowX;
                    var nowY = imageStack[i].nowY;
                    if ((mouse.nowX >= originalX && mouse.nowX <= nowX &&
                            mouse.nowY >= originalY && mouse.nowY <= nowY) ||
                        (mouse.nowX >= nowX && mouse.nowX <= originalX &&
                            mouse.nowY >= nowY && mouse.nowY <= originalY) ||
                        (mouse.nowX <= nowX && mouse.nowX >= originalX &&
                            mouse.nowY >= nowY && mouse.nowY <= originalY) ||
                        (mouse.nowX <= originalX && mouse.nowX >= nowX &&
                            mouse.nowY >= originalY && mouse.nowY <= nowY)) {
                        imageStack.splice(i, 1);
                        deleteSucceed = true;
                    }
                    break;
                case shapeMenu.items.circle:
                    var originalX = imageStack[i].originalX;
                    var originalY = imageStack[i].originalY;
                    var nowX = imageStack[i].nowX;
                    var nowY = imageStack[i].nowY;
                    var radius = Math.sqrt(
                        Math.pow(Math.abs(nowX - originalX) / 2, 2)
                        + Math.pow(Math.abs(nowY - originalY) / 2, 2)
                    );
                    var centerX = originalX
                        + (nowX - originalX) / 2;
                    var centerY = originalY
                        + (nowY - originalY) / 2;
                    //模拟了圆的方程，运用求根公式求解y点
                    var a = 1;
                    var b = -2 * centerY;
                    var c = mouse.originalX * mouse.originalX -
                        2 * centerX * mouse.originalX + centerX * centerX +
                        centerY * centerY - radius * radius;
                    var y1 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
                    var y2 = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);

                    if ((mouse.originalY >= y1 - 3 && mouse.originalY <= y1 + 3) ||
                        (mouse.originalY >= y2 - 3 && mouse.originalY <= y2 + 3)) {
                        imageStack.splice(i, 1);
                        deleteSucceed = true;
                    }
                    break;
                case shapeMenu.items.oval:
                    var centerX = imageStack[i].originalX;
                    var centerY = imageStack[i].originalY;
                    var height = imageStack[i].nowY - imageStack[i].originalY;
                    var width = imageStack[i].nowX - imageStack[i].originalX;

//                            var originalX = centerX + width;
//                            var originalY = centerY;

                    for (var h = 0; h <= 2 * Math.PI; h += 1 / 800) {
                        var nowX = centerX + width * Math.cos(h);
                        var nowY = centerY + height * Math.sin(h);
                        if (Math.abs(mouse.originalX - nowX) < 2 &&
                            Math.abs(mouse.originalY - nowY) < 2) {
                            imageStack.splice(i, 1);
                            deleteSucceed = true;
                            break;
                        }
                    }
                    break;
                case shapeMenu.items.rectangle:
                    var originalX = imageStack[i].originalX;
                    var originalY = imageStack[i].originalY;
                    var nowX = imageStack[i].nowX;
                    var nowY = imageStack[i].nowY;

                    if ((mouse.nowX >= originalX && mouse.nowX <= nowX &&
                            mouse.nowY >= originalY && mouse.nowY <= nowY) ||
                        (mouse.nowX >= nowX && mouse.nowX <= originalX &&
                            mouse.nowY >= nowY && mouse.nowY <= originalY) ||
                        (mouse.nowX <= nowX && mouse.nowX >= originalX &&
                            mouse.nowY >= nowY && mouse.nowY <= originalY) ||
                        (mouse.nowX <= originalX && mouse.nowX >= nowX &&
                            mouse.nowY >= originalY && mouse.nowY <= nowY)) {
                        imageStack.splice(i, 1);
                        deleteSucceed = true;
                    }
                    break;
                default:
                    console.log('imageStack 里面没有这个名字的对象');
            }
        }
        if (deleteSucceed) {
            context.clearRect(0, 0, myCanvas.width, myCanvas.height);
            for (var k = 0; k < imageStack.length; k++) {
                imageStack[k].draw();
            }
        }
    }
}

/**
 * 鼠标移动的时候会执行的函数
 * @param event 系统级的对象
 */
function myCanvasMouseMove(event) {
    if (mouse.getMouseStatus() === mouse.mouseStatusList.down) {
        console.log('mouse moving on down condition');
        mouse.nowX = event.offsetX;
        mouse.nowY = event.offsetY;
        if (eraserMenu.getCurrent() === eraserMenu.items.unchecked) {
            drawShape();
        } else {
            deleteShape();
        }
    }
}

/**
 * 鼠标抬起（其实应该叫手指抬起）的时候，执行的函数
 * 处理收尾工作，imageData入imageStack栈
 */
function myCanvasMouseUp() {
    console.log('mouse up');
    if (mouse.getMouseStatus() === mouse.mouseStatusList.down) {
        switch (shapeMenu.getCurrent()) {
            case shapeMenu.items.curve:
                var curve = new Curve(curveArray, shapeMenu.items.curve);
                imageStack.push(curve);
                break;
            case shapeMenu.items.line:
                imageStack.push(new Line(mouse.originalX, mouse.originalY,
                    mouse.nowX, mouse.nowY,
                    mouse.mouseWidth, mouse.mouseColor,
                    shapeMenu.items.line));
                break;
            case shapeMenu.items.circle:
                imageStack.push(new Circle(mouse.originalX, mouse.originalY,
                    mouse.nowX, mouse.nowY,
                    mouse.mouseWidth, mouse.mouseColor,
                    shapeMenu.items.circle));
                break;
            case shapeMenu.items.oval:
                imageStack.push(new Oval(mouse.originalX, mouse.originalY,
                    mouse.nowX, mouse.nowY,
                    mouse.mouseWidth, mouse.mouseColor,
                    shapeMenu.items.oval));
                break;
            case shapeMenu.items.rectangle:
                imageStack.push(new Rectangle(mouse.originalX, mouse.originalY,
                    mouse.nowX, mouse.nowY,
                    mouse.mouseWidth, mouse.mouseColor,
                    shapeMenu.items.rectangle));
                break;
        }

        console.log(imageStack);

        mouse.setMouseStatusUp();
        mouse.nowX = null;
        mouse.nowY = null;
    }
}

/**
 * 这三个函数是用来给myCanvas绑定事件的，三个事件详见上面代码
 */
myCanvas.addEventListener('mousedown', myCanvasMouseDown);
myCanvas.addEventListener('mouseup', myCanvasMouseUp);
myCanvas.addEventListener('mousemove', myCanvasMouseMove);