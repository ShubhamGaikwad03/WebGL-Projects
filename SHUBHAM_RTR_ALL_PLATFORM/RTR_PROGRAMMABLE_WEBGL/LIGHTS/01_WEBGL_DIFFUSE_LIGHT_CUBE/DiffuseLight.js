//Diffuse Light
var canvas = null;
var gl = null;
var bFullscreen = false;
var canvas_original_width;
var canvas_original_height;


const WebGLMacros =
    {
        VDG_ATTRIBUTE_VERTEX: 0,
        VDG_ATTRIBUTE_COLOR: 1,
        VDG_ATTRIBUTE_NORMAL: 2,
        VDG_ATTRIBUTE_TEXTURE0: 3,
    };


var vertexShaderObject;
var fragmentShaderObject;
var shaderProgramObject;

var vao_cube;
var vbo_cube_position;
var vbo_cube_normal;

var perspectiveProjectionMatrix;

var modelViewMatrixUniform, projectionMatrixUniform;
var ldUniform, kdUniform, lightPositionUniform;
var LKeyPressedUniform;

var angle_cube = 0.0;

var bLKeyPressed = false;

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

function main() {
    canvas = document.getElementById("AMC");
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



function toggleFullScreen() {
    var fullscreen_element =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
    document.msFullscreenElement ||
    null;



    if (fullscreen_element == null) {
        if (canvas.requestFullscreen)
            canvas.requestFullscreen();
        else if (canvas.mozRequestFullScreen)
            canvas.mozRequestFullScreen();
        else if (canvas.webkitRequestFullscreen)
            canvas.webkitRequestFullscreen();
        else if (canvas.oRequestFullscreen)
            canvas.oRequestFullscreen();
        else if (canvas.msRequestFullscreen)
            canvas.msRequestFullscreen();
        bFullscreen = true;

    }
    else {
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







function init()
{
    gl = canvas.getContext("webgl2");
    if(gl==null)
    {
        console.log("Failed to get the rendering context for WEBGL\n");
        return;
    }

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    //vertex shader
    var vertexShaderSourceCode =
        "#version 300 es" +
        "\n" +
        "in vec4 vPosition;" +
        "in vec3 vNormal;" +
        "uniform mat4 u_model_view_matrix;" +
        "uniform mat4 u_projection_matrix;" +
        "uniform mediump int u_LKeyPressed;" +
        "uniform vec3 u_Ld;" +
        "uniform vec3 u_Kd;" +
        "uniform vec4 u_light_position;" +
        "out vec3 diffuse_light;" +
        "void main(void)" +
        "{" +
        "if(u_LKeyPressed == 1)" +
        "{" +
        "vec4 eyeCoordinates = u_model_view_matrix* vPosition;" +
        "vec3 tnorm = normalize(mat3(u_model_view_matrix)*vNormal);" +
        "vec3 s = normalize(vec3(u_light_position - eyeCoordinates));" +
        "diffuse_light = u_Ld * u_Kd *max(dot(s,tnorm),0.0);" +
        "}" +
        "gl_Position=u_projection_matrix * u_model_view_matrix * vPosition;" +
        "}";




    vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShaderObject, vertexShaderSourceCode);
    gl.compileShader(vertexShaderObject);
    if(gl.getShaderParameter(vertexShaderObject,gl.COMPILE_STATUS)== false)
    {
        var error = gl.getShaderInfoLog(vertexShaderObject);
        if(error.length>0)
        {
            alert(error);
            uninitialize();
        }
    }


    //fragment shader
    var fragmentShaderSourceCode =
        "#version 300 es" +
        "\n" +
        "precision highp float;" +
        "in vec3 diffuse_light;" +
        "out vec4 FragColor;" +
        "uniform int u_LKeyPressed;" +
        "void main(void)" +
        "{" +
        "vec4 color;" +
        "if(u_LKeyPressed == 1)" +
        "{" +
        "color = vec4(diffuse_light,1.0);" +
        "}" +
        "else" +
        "{" +
        "color = vec4(1.0,1.0,1.0,1.0);" +
        "}" +
        "FragColor = color;" +
        "}";


        fragmentShaderObject=gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShaderObject,fragmentShaderSourceCode);
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

        shaderProgramObject = gl.createProgram();
        gl.attachShader(shaderProgramObject,vertexShaderObject);
        gl.attachShader(shaderProgramObject,fragmentShaderObject);

        gl.bindAttribLocation(shaderProgramObject,WebGLMacros.VDG_ATTRIBUTE_VERTEX,"vPosition");
        gl.bindAttribLocation(shaderProgramObject,WebGLMacros.VDG_ATTRIBUTE_NORMAL,"vNormal");

        //linking
        gl.linkProgram(shaderProgramObject);
        if(gl.getProgramParameter(shaderProgramObject,gl.LINK_STATUS))
        {
            var error = gl.getProgramInfoLog(shaderProgramObject);
            if(error.length > 0)
            {
                alert(error);
                uninitialize();
            }
        }



        modelViewMatrixUniform = gl.getUniformLocation(shaderProgramObject, "u_model_view_matrix");
        projectionMatrixUniform = gl.getUniformLocation(shaderProgramObject, "u_projection_matrix");

        LKeyPressedUniform = gl.getUniformLocation(shaderProgramObject,"u_LKeyPressed");

        ldUniform = gl.getUniformLocation(shaderProgramObject, "u_Ld");
        kdUniform = gl.getUniformLocation(shaderProgramObject, "u_Kd");
        lightPositionUniform = gl.getUniformLocation(shaderProgramObject, "u_light_position");



        var cubeVertices = new Float32Array([
        	
		1.0, 1.0, -1.0,
		-1.0, 1.0, -1.0,
		-1.0, 1.0, 1.0,
		1.0, 1.0, 1.0,

    //bottom
		1.0, -1.0, 1.0,
		-1.0, -1.0, 1.0,
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,

    //front
		1.0, 1.0, 1.0,
		-1.0, 1.0, 1.0,
		-1.0, -1.0, 1.0,
		1.0, -1.0, 1.0,

    //back 
		1.0, 1.0, -1.0,
		-1.0, 1.0, -1.0,
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		
    //right
		1.0, 1.0, -1.0,
		1.0, 1.0, 1.0,
		1.0, -1.0, 1.0,
		1.0, -1.0, -1.0,

    //left
		-1.0, 1.0, 1.0,
		-1.0, 1.0, -1.0,
		-1.0, -1.0, -1.0,
		-1.0, -1.0, 1.0,
        ]);

        var cubeNormals = new Float32Array([

       	0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		
		0.0,-1.0, 0.0,
		0.0,-1.0, 0.0,
		0.0,-1.0, 0.0,
		0.0,-1.0, 0.0,

		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,

		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,

		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,

		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
        ]);
    
        vao_cube = gl.createVertexArray();
        gl.bindVertexArray(vao_cube);

        vbo_position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_position);
        gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(WebGLMacros.VDG_ATTRIBUTE_VERTEX, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(WebGLMacros.VDG_ATTRIBUTE_VERTEX);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        vbo_cube_normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_cube_normal);
        gl.bufferData(gl.ARRAY_BUFFER, cubeNormals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(WebGLMacros.VDG_ATTRIBUTE_NORMAL, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(WebGLMacros.VDG_ATTRIBUTE_NORMAL);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindVertexArray(null);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
       gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        perspectiveProjectionMatrix = mat4.create();
}





function resize() {

    if (bFullscreen == true) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    mat4.perspective(perspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 100.0);

}




function degToRad(degrees) {

    return (degrees * Math.PI / 180.0);
}






function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgramObject);

    var modelViewMatrix = mat4.create();

    if(bLKeyPressed == true)
    {
        gl.uniform1i(LKeyPressedUniform, 1);

        gl.uniform3f(ldUniform, 1.0, 1.0, 1.0);
        gl.uniform3f(kdUniform, 0.5, 0.5, 0.5);
        var lightPosition = [0.0, 0.0, 2.0, 1.0];
        gl.uniform4fv(lightPositionUniform, lightPosition);
    }
    else {
        gl.uniform1i(LKeyPressedUniform, 0);    
    }

   
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -4.0]);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, degToRad(angle_cube));
    mat4.rotateY(modelViewMatrix, modelViewMatrix, degToRad(angle_cube));
    mat4.rotateZ(modelViewMatrix, modelViewMatrix, degToRad(angle_cube));
  //  mat4.multiply(modelViewProjectionMatrix, perspectiveProjectionMatrix, modelViewMatrix);

    gl.uniformMatrix4fv(modelViewMatrixUniform, false, modelViewMatrix);
    gl.uniformMatrix4fv(projectionMatrixUniform, false, perspectiveProjectionMatrix);

    gl.bindVertexArray(vao_cube);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 12, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 16, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 20, 4);

    gl.bindVertexArray(null);


    gl.useProgram(null);
    update();
    requestAnimationFrame(draw, canvas);

}


    function update() {
    
        angle_cube = angle_cube + 2.0;
        if (angle_cube >= 360.0)
            angle_cube = 0.0;
    }

    function uninitialize() {
      

        if (vao_cube) {
            gl.deleteBuffer(vao_cube);
            vao_cube = null;
        }

       
        if (vbo_cube_position) {
            gl.deleteBuffer(vbo_cube_position);
            vbo_cube_position = null;
        }

        if (vbo_cube_normal) {
            gl.deleteBuffer(vbo_cube_normal);
            vbo_cube_normal = null;
        }

        if (shaderProgramObject) {
            if (fragmentShaderObject) {
                gl.detachShader(shaderProgramObject, fragmentShaderObject);
                gl.deleteShader(fragmentShaderObject);
                fragmentShaderObject = null;
            }



            if (vertexShaderObject) {
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
                window.close();
                uninitialize();
                break;
            case 76: // for 'L' or 'l'
                if (bLKeyPressed == false)
                    bLKeyPressed = true;
                else
                    bLKeyPressed = false;
                break;
            case 70:
                toggleFullScreen();
                break;
        }
    }



    function mouseDown() {
        //  alert("mouseDown");
    }




























