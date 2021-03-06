import React, { Component } from "react";
import PropTypes from "prop-types";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Card,
  CardBody,
  CardTitle,
  Input,
  InputGroup,
  InputGroupAddon
} from "reactstrap";
import brainjs from "brain.js";

const configField = {
  backgroundUrl: "fon.jpg"
};

export default class Field extends Component {
  constructor(props) {
    super(props);

    this.state = { height: 1000, width: 2000 };

    this.fieldRef = React.createRef();

    this.startTrain = this.startTrain.bind(this);
    this.stopTrain = this.stopTrain.bind(this);
    this.renderBackgroundToField = this.renderBackgroundToField.bind(this);

    this.backgroundImage = new Image();
    this.backgroundImage.src = configField.backgroundUrl;
    this.backgroundImage.onload = () => {
      this.renderBackgroundToField(this.fieldRef.current, this.backgroundImage);
    };
  }
  startTrain(data, iterations, errorThresh, activation, hiddenLayers) {
    try {
      const {
        current: { addInfoToConsole }
      } = this.props.console;

      addInfoToConsole("Нейронная сеть перезапущена с новыми параметрами.");

      this.brain = new brainjs.recurrent.LSTM({
        hiddenLayers: hiddenLayers,
        activation: activation
      });

      this.training = setInterval(() => {
        this.brain.train(data, {
          iterations: 1 /*iterations*/,
          errorThresh: errorThresh,
          log: event => addInfoToConsole(event),
          logPeriod: 10,
          learningRate: 0.3,
          momentum: 0.1,
          callbackPeriod: 10,
          timeout: null,
          callback: () => {
            this.renderField(this.fieldRef.current);
          }
        });
      }, Math.max(Math.max.apply(null, hiddenLayers) * hiddenLayers.length, 100));
    } catch (error) {
      this.props.error(error.message);
    }
  }
  stopTrain() {
    clearInterval(this.training);
  }
  renderBackgroundToField(
    canvas = this.fieldRef.current,
    backgroundImage = this.backgroundImage
  ) {
    const { height, width } = this.state;
    canvas.getContext("2d").drawImage(backgroundImage, 0, 0, width, height);
  }
  renderField(canvas = this.fieldRef.current) {
    const {
      model: { hiddenLayers }
    } = this.brain;

    const layersWeights = [];
    for (
      let layerIndex = 0;
      layerIndex < hiddenLayers.length;
      layerIndex += 1
    ) {
      const layer = hiddenLayers[layerIndex];
      const weights = [];
      for (
        let weightIndex = 0;
        weightIndex < layer.cellActivationBias.weights.length;
        weightIndex += 1
      ) {
        weights.push({
          input: layer.inputBias.weights[weightIndex],
          activation: layer.cellActivationBias.weights[weightIndex],
          output: layer.outputBias.weights[weightIndex]
        });
      }
      layersWeights.push(weights);
    }

    console.log("Нейронная сеть", this.brain);
    console.log("Скрытые слои", hiddenLayers);
    console.log("Веса", layersWeights);

    this.renderBackgroundToField(this.fieldRef.current, this.backgroundImage);
    const context = canvas.getContext("2d");

    layersWeights.forEach((layerWeights, layerIndex) => {
      layerWeights.forEach((weight, weightIndex) => {
        const xOffset = this.state.width / layersWeights.length / 2;
        const yOffset = this.state.height / layerWeights.length / 2;
        const xPosition =
          (this.state.width / layersWeights.length) * layerIndex + xOffset;
        const yPosition =
          (this.state.height / layerWeights.length) * weightIndex + yOffset;
        context.lineWidth =
          Math.min(this.state.width, this.state.height) /
          layerWeights.length /
          100;

        // связи между нейронами
        if (layerIndex + 1 < layersWeights.length) {
          layersWeights[layerIndex + 1].forEach((weightNext, weightIndex) => {
            context.beginPath();

            const xOffsetNext = this.state.width / layersWeights.length / 2;
            const yOffsetNext =
              this.state.height / layersWeights[layerIndex + 1].length / 2;
            const xPositionNext =
              (this.state.width / layersWeights.length) * (layerIndex + 1) +
              xOffsetNext;
            const yPositionNext =
              (this.state.height / layersWeights[layerIndex + 1].length) *
                weightIndex +
              yOffsetNext;

            const gradient = context.createLinearGradient(
              xPosition,
              yPosition,
              xPositionNext,
              yPositionNext
            );
            gradient.addColorStop(
              0.0,
              weight.output < weight.activation
                ? "rgba(0,0,0,255)"
                : "rgba(255,255,255,255)"
            );
            gradient.addColorStop(
              1.0,
              weightNext.input < weightNext.activation
                ? "rgba(0,0,0,255)"
                : "rgba(255,255,255,255)"
            );
            context.strokeStyle = gradient;
            context.moveTo(xPosition, yPosition);
            context.lineTo(xPositionNext, yPositionNext);
            context.stroke();
            context.closePath();
          });
        }

        // нейроны
        const radius = Math.max(
          (Math.abs(weight.activation) * Math.min(xOffset, yOffset)) / 4,
          Math.min(xOffset, yOffset) / 10
        );
        const fillStyle =
          weight.output < weight.activation
            ? "rgba(255,45,84,255)"
            : "rgba(0,255,147,255)";
        const strokeStyle =
          weight.output < weight.activation
            ? "rgba(0,0,0,255)"
            : "rgba(255,255,255,255)";
        context.beginPath();
        context.arc(xPosition, yPosition, radius, 0, Math.PI * 2, false);
        context.closePath();
        context.strokeStyle = strokeStyle;
        context.fillStyle = fillStyle;
        context.fill();
        context.stroke();
        context.closePath();
      });
    });
  }
  render() {
    return (
      <Card className="m-3" body outline color="secondary">
        <CardTitle className="text-center">Модель развития</CardTitle>
        <hr className="my-1" />
        <InputGroup>
          <InputGroupAddon addonType="prepend">Высота</InputGroupAddon>
          <Input
            style={{ fontSize: "10px" }}
            type="number"
            placeholder="****"
            defaultValue="1000"
            onChange={value => {
              this.setState({ height: value.target.value });
              this.renderBackgroundToField(
                this.fieldRef.current,
                this.backgroundImage
              );
            }}
          />
          <InputGroupAddon addonType="prepend">Ширина</InputGroupAddon>
          <Input
            style={{ fontSize: "10px" }}
            type="number"
            placeholder="****"
            defaultValue="2000"
            onChange={value => {
              this.setState({ width: value.target.value });
              this.renderBackgroundToField(
                this.fieldRef.current,
                this.backgroundImage
              );
            }}
          />
        </InputGroup>
        <hr className="my-1" />
        <CardBody>
          <canvas
            ref={this.fieldRef}
            height={this.state.height}
            width={this.state.width}
            style={{
              width: "100%"
            }}
          />
        </CardBody>
      </Card>
    );
  }
}

Field.propTypes = {
  console: PropTypes.shape({
    current: PropTypes.shape({
      addInfoToConsole: PropTypes.func,
      error: PropTypes.func.isRequired
    })
  })
};
