var canvas = null;
var gl = null;
var bFullscreen = null;
var canvas_original_width;
var canvas_original_height;

const WebGLMacros =
    {
        VDG_ATTRIBUTE_VERTEX: 0,
        VDG_ATTRIBUTE_COLOR: 1,
        VDG_ATTRIBUTE_NORMAL: 2,
        VDG_ATTRIBUTE_TEXTURE: 3,
    };




var vertexShaderObject;
var fragmentShaderObject;
var shaderProgramObject;


var vao_Trianlge;
var vbo_Position_Triangle;
var vbo_Color_Triangle;

var vao_Square;
var vbo_Position_Square;
var vbo_Color_Square;

var mvpUniform;
var u_Translation;

var triangleRotation;
var squareRptation;
var angleX = 0.0;
var angleY = 0.0;


var perspectiveProjectionMatrix;

var requestAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame;


var cancelAnimationFrame =
    window.cancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelRequestAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelRequestAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.msCancelRequestAnimationFrame ||
    window.msCancelAnimationFrame;

function main()
{
    canvas=document.getElementById("AMC");
    if (!canvas)
        console.log("Obtaining Canvas Failed\n");
    else
        console.log("Obtaining Canvas Succeeded\n");
    

    canvas_original_width = canvas.width;
    canvas_original_height = canvas.height;

    window.addEventListener("keydown", keyDown, false);
    window.addEventListener("click", mouseDown, false);
    window.addEventListener("resize", resize, false);

    init();

    resize();
    draw();

   }

function toggleFullScreen()
{
    var fullscreen_element = 
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
    document.msFullscreenElement ||
    null;



    if(fullscreen_element == null)
    {
        if (canvas.requestFullscreen)
            canvas.requestFullscreen();
        else if (canvas.mozRequestFullScreen)
            canvas.mozRequestFullScreen();
        else if(canvas.webkitRequestFullscreen)
            canvas.webkitRequestFullscreen();
        else if (canvas.oRequestFullscreen)
            canvas.oRequestFullscreen();
        else if (canvas.msRequestFullscreen)
            canvas.msRequestFullscreen();
        bFullscreen = true;

    }
    else
    {
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.mozCancelFullScreen)
            document.mozCancelFullScreen();
        else if (document.webkitExitFullScreen)
            document.webkitExitFullScreen();
        else if (document.msExitFullscreen)
            document.msExitFullscreen();
        bFullscreen = false;
    }


}








function init() {
    gl = canvas.getContext("webgl2");
    if (gl == null) {
        console.log("Failed to get the rendering context for WEBGL");
        return;
    }

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;




    //VERTEX SHADER
    var vertexShaderSourceCode =
        "#version 300 es" +
        "\n" +
          "in vec4 vPosition;" +
          "in vec4 vColor;" +
          "out vec4 out_Color;" +
        "uniform mat4 u_mvp_matrix;" +
        "void main(void)" +
        "{" +
        "gl_Position = u_mvp_matrix * vPosition;" +
        "out_Color = vColor;" +
        "}";

    vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShaderObject, vertexShaderSourceCode);
    gl.compileShader(vertexShaderObject);
    if(gl.getShaderParameter(vertexShaderObject,gl.COMPILE_STATUS) ==false)
    {
        var error = gl.getShaderInfoLog(vertexShaderObject);
        if(error.length >0)
        {
            alert(error);
            unitialize();
        }
    }


    //fragment shader
    var fragmentShaderSourceCode =
        "#version 300 es" +
        "\n" +
         "precision highp float;" +
         "in vec4 out_Color;" +
        "out vec4 FragColor;" +
        "void main(void)" +
        "{" +
        "FragColor =out_Color;" +
        "}";

    fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderObject, fragmentShaderSourceCode);
    gl.compileShader(fragmentShaderObject);
    if(gl.getShaderParameter(fragmentShaderObject,gl.COMPILE_STATUS)==false)
    {
        var error = gl.getShaderInfoLog(fragmentShaderObject);
        if(error.length > 0)
        {
            alert(error);
            uninitialize();
        }
    }


    //shader program 
    shaderProgramObject = gl.createProgram();
    gl.attachShader(shaderProgramObject, vertexShaderObject);
    gl.attachShader(shaderProgramObject, fragmentShaderObject);


    gl.bindAttribLocation(shaderProgramObject, WebGLMacros.VDG_ATTRIBUTE_VERTEX, "vPosition");
    gl.bindAttribLocation(shaderProgramObject, WebGLMacros.VDG_ATTRIBUTE_COLOR, "vColor");

    gl.linkProgram(shaderProgramObject);
    if(!gl.getProgramParameter(shaderProgramObject,gl.LINK_STATUS))
    {
        var error = gl.getProgramInfoLog(shaderProgramObject);
        if(error.length >0)
        {
            alert(error);
            uninitialize();
        }
    }

    mvpUniform = gl.getUniformLocation(shaderProgramObject, "u_mvp_matrix");
//    u_Translation = gl.getUniformLocation(shaderProgramObject, "u_Translation");

    var triangleVertices = new Float32Array([0.0, 1.0, 0.0,
                                               -1.0, -1.0, 0.0,
                                                 1.0, -1.0, 0.0]);

    var colorVerticesTriangle = new Float32Array([1.0, 0.0, 0.0,
                                                  0.0, 1.0, 0.0,
                                                   0.0, 0.0, 1.0]);


    var squareVertices = new Float32Array([-1.0, 1.0, 0.0,
                                            -1.0, -1.0, 0.0,
                                            1.0, -1.0, 0.0,
                                            1.0,1.0,0.0]);


    vao_Trianlge = gl.createVertexArray();
    gl.bindVertexArray(vao_Trianlge);
    
    vbo_Position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_Position);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(WebGLMacros.VDG_ATTRIBUTE_VERTEX, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(WebGLMacros.VDG_ATTRIBUTE_VERTEX);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    vbo_Color_Triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_Color_Triangle);
    gl.bufferData(gl.ARRAY_BUFFER, colorVerticesTriangle, gl.STATIC_DRAW);
    gl.vertexAttribPointer(WebGLMacros.VDG_ATTRIBUTE_COLOR, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(WebGLMacros.VDG_ATTRIBUTE_COLOR);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindVertexArray(null);



    vao_Square = gl.createVertexArray();
    gl.bindVertexArray(vao_Square);

    vbo_Position_Square = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_Position_Square);
    gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(WebGLMacros.VDG_ATTRIBUTE_VERTEX, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(WebGLMacros.VDG_ATTRIBUTE_VERTEX);
    gl.vertexAttrib3f(WebGLMacros.VDG_ATTRIBUTE_COLOR, 0.392, 0.584, 0.929);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindVertexArray(null);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    perspectiveProjectionMatrix = mat4.create();

}


function resize()
{

    if(bFullscreen==true)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else
    {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    mat4.perspective(perspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 100.0);

}



function degToRad(degrees) {

    return (degrees * Math.PI / 180.0);
}






function draw()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgramObject);

    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();

    mat4.translate(modelViewMatrix, modelViewMatrix, [-1.5, 0.0, -6.0]);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, degToRad(angleY));

    mat4.multiply(modelViewProjectionMatrix, perspectiveProjectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(mvpUniform, false, modelViewProjectionMatrix);

    gl.bindVertexArray(vao_Trianlge);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindVertexArray(null);


    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();
    var translationVector = vec3.create();

     mat4.translate(modelViewMatrix, modelViewMatrix, [1.5, 0.0, -6.0]);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, degToRad(angleX));

    mat4.multiply(modelViewProjectionMatrix, perspectiveProjectionMatrix, modelViewMatrix);

    gl.uniformMatrix4fv(mvpUniform, false, modelViewProjectionMatrix);
    gl.bindVertexArray(vao_Square);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);


    gl.useProgram(null);
    update();
    requestAnimationFrame(draw, canvas);

}


function update() {
    angleX = angleX + 1.0;
    if (angleX >= 360.0)
        angleX = 0.0;

    angleY = angleY + 1.0;
    if (angleY >= 360.0)
        angleY = 0.0;

}



function uninitialize()
{
    if(vao_Square)
    {
        gl.deleteVertexArray(vao_Square);
        vao_Square = null;
    }

    if(vbo_Position)
    {
        gl.deleteBuffer(vbo_Position);
        vbo_Position = null;
    }

    if (vao_Trianlge)
    {
        gl.deleteBuffer(vao_Trianlge);
        vao_Trianlge = null;
    }


    if(shaderProgramObject)
    {
        if(fragmentShaderObject)
        {
            gl.detachShader(shaderProgramObject, fragmentShaderObject);
            gl.deleteShader(fragmentShaderObject);
            fragmentShaderObject = null;
        }



        if(vertexShaderObject)
        {
            gl.detachShader(shaderProgramObject, vertexShaderObject);
            gl.deleteShader(vertexShaderObject);
            vertexShaderObject = null;
        }

        gl.deleteProgram(shaderProgramObject);
        shaderProgramObject = null;
    }
}






function keyDown(event) {

    switch (event.keyCode) {
        case 27:
       //    uninitialize();
            window.close();

            break;

        case 70:
            toggleFullScreen();
            break;
    }
}



function mouseDown()
{
  //  alert("mouseDown");
}
















