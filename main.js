"use strict";

// canvas
let canvasHeight = 400;
let canvasWidth = 600;
let controlPointsRadius = 6;
let segmentPointsRadius = 4;
let controlPointsColor = 'rgba(250,0,0,1)';
let controlPointsLinesColor = 'rgb(82,186,252)';
let firstSegmentationPointsColor = 'rgba(35,192,33,1)';
let firstSegmentationLinesColor = 'rgba(40,218,37,1)';
let secondSegmentationPointsColor = 'rgb(217,219,31)';
let secondSegmentationLinesColor = 'rgb(245,234,36)';
let thirdSegmentationPointsColor = 'rgba(208,14,238,1)';
let bezierCurveColor = 'rgba(0,0,0,1)';
let legendBorderColor = 'rgba(0,0,0,1)';
let legendFontColor = 'rgba(0,0,0,1)';
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
// inputs
let defaultSliderBezierCurveResolution = 16;
let defaultSliderTValue = 0.5;
let defaultSliderSegmentation = 3;

function init() {
    // init inputs
    let isGrabbing = false;
    let grabbedPoint = 0;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    const sliderBezierCurveResolution = document.querySelector('#bezier-curve-resolution-slider');
    const sliderTValue = document.querySelector('#t-value-slider');
    const sliderSegmentation = document.querySelector('#segmentation-slider');
    const tValueSpan = document.querySelector("#t-value");
    const bezierCurveResolutionSpan = document.querySelector("#bezier-curve-resolution");
    const segmentationSpan = document.querySelector("#segmentation");
    sliderBezierCurveResolution.value = defaultSliderBezierCurveResolution;
    bezierCurveResolutionSpan.innerText = sliderBezierCurveResolution.value;
    sliderTValue.value = defaultSliderTValue;
    tValueSpan.innerText = sliderTValue.value;
    sliderSegmentation.value = defaultSliderSegmentation;
    segmentationSpan.innerText = sliderSegmentation.value;

    sliderBezierCurveResolution.addEventListener('input', (event) => {
        draw(controlPoints, sliderTValue.value, event.target.value, sliderSegmentation.value);
        bezierCurveResolutionSpan.innerText = event.target.value;
    });
    sliderTValue.addEventListener('input', (event) => {
        draw(controlPoints, event.target.value, sliderBezierCurveResolution.value, sliderSegmentation.value);
        tValueSpan.innerText = event.target.value;
    });
    sliderSegmentation.addEventListener('input', (event) => {
        draw(controlPoints, sliderTValue.value, sliderBezierCurveResolution.value, event.target.value);
        segmentationSpan.innerText = event.target.value;
    });

    canvas.addEventListener('mousemove', e => {
        let pointHover = false;
        if(isGrabbing) {
            controlPoints[grabbedPoint].x = e.offsetX;
            controlPoints[grabbedPoint].y = e.offsetY;
            draw(controlPoints, sliderTValue.value, sliderBezierCurveResolution.value, sliderSegmentation.value);
        } else {
            for (let i = 0; i < controlPoints.length; i++) {
                if(e.offsetX < controlPoints[i].x + controlPointsRadius &&
                    e.offsetX > controlPoints[i].x - controlPointsRadius &&
                    e.offsetY < controlPoints[i].y + controlPointsRadius &&
                    e.offsetY > controlPoints[i].y - controlPointsRadius) {
                    pointHover = true;
                }
            }
            if(pointHover && !isGrabbing) {
                document.body.style.cursor = "grab";
            }
            if(!pointHover && !isGrabbing) {
                document.body.style.cursor = "default";
            }
        }
    });

    canvas.addEventListener('mousedown', e => {
        if(!isGrabbing) {
            for (let i = 0; i < controlPoints.length; i++) {
                if(e.offsetX < controlPoints[i].x + controlPointsRadius &&
                    e.offsetX > controlPoints[i].x - controlPointsRadius &&
                    e.offsetY < controlPoints[i].y + controlPointsRadius &&
                    e.offsetY > controlPoints[i].y - controlPointsRadius) {
                    document.body.style.cursor = "grabbing";
                    isGrabbing = true;
                    grabbedPoint = i;
                }
            }
        }
    });

    canvas.addEventListener('mouseup', e => {
        let pointHover = false;
        for (let i = 0; i < controlPoints.length; i++) {
            if(e.offsetX < controlPoints[i].x + controlPointsRadius &&
                e.offsetX > controlPoints[i].x - controlPointsRadius &&
                e.offsetY < controlPoints[i].y + controlPointsRadius &&
                e.offsetY > controlPoints[i].y - controlPointsRadius) {
                pointHover = true;
            }
        }
        if(isGrabbing && pointHover) {
            document.body.style.cursor = "grab";
            isGrabbing = false;
        } else {
            document.body.style.cursor = "default";
            isGrabbing = false;
        }
    });
    
    // init control points
    let controlPoints = new Array(4);
    controlPoints[0] = {
        x: 0.25 * canvas.width,
        y: 0.667 * canvas.height
    }
    controlPoints[1] = {
        x: 0.3125 * canvas.width,
        y: 0.1667 * canvas.height
    }
    controlPoints[2] = {
        x: 0.625 * canvas.width,
        y: 0.2 * canvas.width
    }
    controlPoints[3] = {
        x: 0.75 * canvas.width,
        y: 0.5833 * canvas.height
    }

    // draw
    draw(controlPoints, sliderTValue.value, sliderBezierCurveResolution.value, sliderSegmentation.value);
}

function lerp(a, b, t)
{
    return (1 - t) * a + t * b;
}

function pointOnBezierCurve(points, t) {
    // init points
    let segmentationPoints = new Array(points.length - 1);
    for(let i = 0; i < segmentationPoints.length ; i++) {
        let firstPoint = points[i];
        let secondPoint = points[i+1];

        segmentationPoints[i] = {
            x: lerp(firstPoint.x, secondPoint.x, t),
            y: lerp(firstPoint.y, secondPoint.y, t)
        }
    }

    // point on bezier curve
    if(segmentationPoints.length === 1) {
        return segmentationPoints[0];
    }

    return pointOnBezierCurve(segmentationPoints, t)
}

function drawSegmentation(points, t, segmentation) {
    drawSegmentationT(points, t, segmentation, 0);
}

function drawSegmentationT(points, t, segmentation, currentDepth) {
    if(segmentation === currentDepth) {
        return;
    }
    
    // init points
    let segmentationPoints = new Array(points.length - 1);
    for(let i = 0; i < segmentationPoints.length ; i++) {
        let firstPoint = points[i];
        let secondPoint = points[i+1];

        segmentationPoints[i] = {
            x: lerp(firstPoint.x, secondPoint.x, t),
            y: lerp(firstPoint.y, secondPoint.y, t)
        }
    }

    // color init for segmentation
    switch (currentDepth) {
        case 0:
            ctx.fillStyle = firstSegmentationPointsColor;
            ctx.strokeStyle = firstSegmentationLinesColor;
            break;
        case 1:
            ctx.fillStyle = secondSegmentationPointsColor;
            ctx.strokeStyle = secondSegmentationLinesColor;
            break;
        case 2:
            ctx.fillStyle = thirdSegmentationPointsColor;
            break;
        default:
            ctx.fillStyle = controlPointsColor;
            ctx.strokeStyle = controlPointsLinesColor;
            break;
    }
    
    
    // draw lines
    if(segmentationPoints.length !== 1) {
        for(let i = 0; i < segmentationPoints.length - 1; i++) {
            ctx.beginPath();
            ctx.moveTo(segmentationPoints[i].x, segmentationPoints[i].y);
            ctx.lineTo(segmentationPoints[i+1].x, segmentationPoints[i+1].y);
            ctx.stroke();
        }
    }
    
    // draw points
    segmentationPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, segmentPointsRadius, 0, 2 * Math.PI);
        ctx.fill();
    })
    
    // point on bezier curve
    if(segmentationPoints.length === 1) {
        return;
    }
    
    drawSegmentationT(segmentationPoints, t, segmentation, currentDepth + 1)
}

function draw(controlPoints, t, resolution, segmentation) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
    
    drawBezierCurve(controlPoints, parseInt(resolution));
    drawDeCasteljauAlgorithm(controlPoints, t, parseInt(segmentation));
    drawlegend();
}

function drawDeCasteljauAlgorithm(controlPoints, t, segmentation) {
    ctx.fillStyle = controlPointsColor;
    ctx.strokeStyle = controlPointsLinesColor;
    
    // draw control points lines
    for(let i = 0; i < controlPoints.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(controlPoints[i].x, controlPoints[i].y);
        ctx.lineTo(controlPoints[i+1].x, controlPoints[i+1].y);
        ctx.stroke();
    }

    // draw control points
    controlPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, controlPointsRadius, 0, 2 * Math.PI);
        ctx.fill();
    })

    drawSegmentation(controlPoints, t, segmentation);
}

function drawBezierCurve(controlPoints, resolution) {
    // init points
    let bezierPoints = new Array(resolution + 1)
    let iterationStep = 1 / resolution;
    let t = 0;
    for (let i = 0; i < resolution + 1; i++) {
        bezierPoints[i] = pointOnBezierCurve(controlPoints, t);
        t = t + iterationStep;
    }

    ctx.strokeStyle = bezierCurveColor;

    // draw lines
    for(let i = 0; i < bezierPoints.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(bezierPoints[i].x, bezierPoints[i].y);
        ctx.lineTo(bezierPoints[i+1].x, bezierPoints[i+1].y);
        ctx.stroke();
    }
}

function drawlegend() {
    let legendWidth = 130;
    let legendHeight = 70;
    let leftPadding = 15;
    let topPadding = 15;
    let circleLineLength = 15;
    let textLeftPadding = 10;
    let textTopPadding = 15; // does not apply to the first text element
    
    // border
    ctx.strokeStyle = legendBorderColor;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - legendWidth, canvasHeight );
    ctx.lineTo(canvasWidth - legendWidth, canvasHeight - legendHeight);
    ctx.lineTo(canvasWidth, canvasHeight - legendHeight);
    ctx.stroke();

    // control point
    ctx.fillStyle = controlPointsColor;
    ctx.strokeStyle = controlPointsLinesColor;
    
    ctx.beginPath();
    let cpCircleX = canvasWidth - legendWidth + leftPadding + (controlPointsRadius / 2);
    let cpCircleY = canvasHeight - legendHeight + topPadding + (controlPointsRadius / 2);
    ctx.moveTo(cpCircleX, cpCircleY);
    ctx.lineTo(cpCircleX + circleLineLength, cpCircleY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cpCircleX, cpCircleY, controlPointsRadius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = legendFontColor;
    ctx.font = '12px sans serif';
    ctx.fillText('control points', cpCircleX + circleLineLength + textLeftPadding, cpCircleY + (controlPointsRadius / 2));
    
    // segements
    let firstSegmentX = canvasWidth - legendWidth + leftPadding + (segmentPointsRadius / 2);
    let firstSegmentY = canvasHeight - legendHeight + topPadding + ((3 * controlPointsRadius) / 2) + textTopPadding;

    ctx.fillStyle = firstSegmentationPointsColor;
    ctx.beginPath();
    ctx.arc(firstSegmentX, firstSegmentY, segmentPointsRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = secondSegmentationPointsColor;
    ctx.beginPath();
    ctx.arc(firstSegmentX + 5, firstSegmentY, segmentPointsRadius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = thirdSegmentationPointsColor;
    ctx.beginPath();
    ctx.arc(firstSegmentX + 10, firstSegmentY, segmentPointsRadius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = legendFontColor;
    ctx.font = '12px sans serif';
    ctx.fillText('segments (1-3)', firstSegmentX + 16  + textLeftPadding, firstSegmentY + (segmentPointsRadius / 2) + 1);
    
    // bezier curve
    let bezierCurveX = canvasWidth - legendWidth + leftPadding - 2;
    let bezierCurveY = firstSegmentY + (segmentPointsRadius / 2) + textTopPadding + 3;

    ctx.strokeStyle = bezierCurveColor;
    ctx.beginPath();
    ctx.moveTo(bezierCurveX, bezierCurveY);
    ctx.lineTo(bezierCurveX + 17, bezierCurveY);
    ctx.stroke();

    ctx.fillStyle = legendFontColor;
    ctx.font = '12px sans serif';
    ctx.fillText('Bézier curve', bezierCurveX + 20  + textLeftPadding, bezierCurveY + 3);
}

init();