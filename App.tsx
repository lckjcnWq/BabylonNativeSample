/**
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { useState, FunctionComponent, useEffect, useCallback } from "react";
import { Button, Image, SafeAreaView, Slider, StatusBar, Text, View, ViewProps } from "react-native";
import { EngineView, EngineViewCallbacks, useEngine } from "@babylonjs/react-native";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import "@babylonjs/loaders/glTF";
import { Scene } from "@babylonjs/core/scene";
import { WebXRSessionManager, WebXRTrackingState } from "@babylonjs/core/XR";
import {
  Color3,
  CreateLines,
  DeviceSourceManager,
  DeviceType, DynamicTexture, HemisphericLight,
  IMouseEvent, Mesh, MeshBuilder,
  PointerInput, StandardMaterial, Texture,
  TransformNode,
  Vector3, Vector4
} from "@babylonjs/core";
import { Material } from "@babylonjs/core/Materials/material";
import { Color4 } from "@babylonjs/core/Maths/math.color";

const EngineScreen: FunctionComponent<ViewProps> = (props: ViewProps) => {
  const defaultScale = 1;
  const enableSnapshots = false;

  const engine = useEngine();
  const [toggleView, setToggleView] = useState(false);
  const [camera, setCamera] = useState<Camera>();
  const [rootNode, setRootNode] = useState<TransformNode>();
  const [scene, setScene] = useState<Scene>();
  const [xrSession, setXrSession] = useState<WebXRSessionManager>();
  const [scale, setScale] = useState<number>(defaultScale);
  const [snapshotData, setSnapshotData] = useState<string>();
  const [engineViewCallbacks, setEngineViewCallbacks] = useState<EngineViewCallbacks>();
  const [trackingState, setTrackingState] = useState<WebXRTrackingState>();
  const myPoints = [
    new Vector3(0, 0, 2),
    new Vector3(0, 0, 0.7),
    new Vector3(0, 0, 0),
    new Vector3(-2, 0, 0),
    new Vector3(-1, 0, 0),
    new Vector3(1, 0, 0),
    new Vector3(2, 2, 0)
  ];
  const colorRed = new Color3(1,0,0);
  const colorGreen = new Color3(0,1,0);
  const colorBlue = new Color3(0,0,1);
  const colorWhite = new Color3(1,1,1);
  const faceColors:Color4[] = [
    new Color4(1,0,0,1),
    new Color4(0,1,1,1),
    new Color4(0,1,1,1),
    new Color4(1,0,0,1),
    new Color4(0,1,1,1),
    new Color4(0,1,1,1),
  ]

  useEffect(() => {
    if (engine) {
      const scene = new Scene(engine);
      setScene(scene);

      // 1.创建Camera
      const camera = new ArcRotateCamera('Camera',0,0,5,new Vector3(0,0,0),scene);
      camera.setPosition(new Vector3(0,0,-25));
      setCamera(scene.activeCamera!);
      scene.attachControl(true,true,true);

      //2.创建半球光Hemispheric Light
      const light = new HemisphericLight("light",new Vector3(0,1,0),scene);

      // CreateLines("lines", {points: myPoints}, scene)
      //3.创建美化的材质
      const redMat = createMat("red",scene,colorRed,colorRed,colorRed);
      const greenMat = createMat("green",scene,colorGreen,colorGreen,colorGreen);
      const blueMat = createMat("blue",scene,colorBlue,colorBlue,colorBlue);

      //4.创建平面(附着材质)
      // const plane1 = createPlane("plane1",scene,redMat,-3,0,0);
      const plane2 = createPlane("plane2",scene,greenMat,3,0,-1.5);
      const plane3 = createPlane("plane3",scene,blueMat,3,0,1.5);
      // const plane4 = createPlane("plane4",scene,redMat,0,3,0);

      MeshBuilder.CreateBox("box",{width:2,height:4,depth:2, sideOrientation:2,faceColors:faceColors});

      createGroundBack(scene);
      drawLines(scene);

      /**
       * 创建触摸可翻转的控制
       * */
      const rootNode = new TransformNode('Root Container', scene);
      setRootNode(rootNode);
      const deviceSourceManager = new DeviceSourceManager(engine);
      const handlePointerInput = (event: IMouseEvent) => {
        if (event.inputIndex === PointerInput.Move && event.movementX) {
          const distanceX = event.movementX * 0.005
          const distanceY = event.movementY * 0.005
          rootNode.rotate(Vector3.Left(), -distanceX);
          rootNode.rotate(Vector3.Right(), distanceX);
          rootNode.rotate(Vector3.Forward(), distanceY);
          rootNode.rotate(Vector3.Backward(), -distanceY);
        }
      };

      deviceSourceManager.onDeviceConnectedObservable.add(device => {
        if (device.deviceType === DeviceType.Touch) {
          const touch = deviceSourceManager.getDeviceSource(device.deviceType, device.deviceSlot)!;
          touch.onInputChangedObservable.add(touchEvent => {
            handlePointerInput(touchEvent);
          });
        } else if (device.deviceType === DeviceType.Mouse) {
          const mouse = deviceSourceManager.getDeviceSource(device.deviceType, device.deviceSlot)!;
          mouse.onInputChangedObservable.add(mouseEvent => {
            if (mouse.getInput(PointerInput.LeftClick)) {
              handlePointerInput(mouseEvent);
            }
          });
        }
      });

      const transformContainer = new TransformNode('Transform Container', scene);
      transformContainer.parent = rootNode;
      camera.parent = transformContainer

    }
  }, [engine]);


  /**
   * 创建纹理地板
   * */
  const createGroundBack = (scene:Scene)=>{
    const ground = MeshBuilder.CreateGround("ground1",{width:10,height:10,updatable:true,subdivisions:2});
    const groundMaterial = new StandardMaterial("ground",scene);
    groundMaterial.diffuseTexture = new Texture("https://minio.cnbabylon.com/babylon/p9/ground.jpg", scene);
    groundMaterial.diffuseTexture.scale(6)
    groundMaterial.specularColor = new Color3(0, 0, 0);
    ground.material = groundMaterial;
  }

  /**
   * 创建纹理坐标系
   * */
  const drawLines = (scene:Scene)=>{
    const size = 8;
    const axisX = MeshBuilder.CreateLines("axisX", {points:[Vector3.Zero(), new Vector3(size, 0, 0), new Vector3(size * 0.95, 0.05 * size, 0), new Vector3(size, 0, 0), new Vector3(size * 0.95, -0.05 * size, 0)]}, scene);
    axisX.color = colorWhite;
    const xChar = makeTextPlane("X", "red", size / 10);
    xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);

    const axisY = MeshBuilder.CreateLines("axisY", {
      points: [
        Vector3.Zero(), new Vector3(0, size, 0), new Vector3(-0.05 * size, size * 0.95, 0),
        new Vector3(0, size, 0), new Vector3(0.05 * size, size * 0.95, 0)
      ]
    }, scene);
    axisY.color = colorGreen;
    const yChar = makeTextPlane("Y", "green", size / 10);
    yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);


    const axisZ = MeshBuilder.CreateLines("axisZ", {points:[
        Vector3.Zero(), new Vector3(0, 0, size), new Vector3(0, -0.05 * size, size * 0.95),
        new Vector3(0, 0, size), new Vector3(0, 0.05 * size, size * 0.95)
      ]}, scene);
    axisZ.color = colorBlue;
    const zChar = makeTextPlane("Z", "blue", size / 10);
    zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
  }

  const makeTextPlane = function (text:string, color:string, size:number) {
    const dynamicTexture = new DynamicTexture("DynamicTexture", 50, scene, true);
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, 5, 40, "bold 60px Arial", color, "transparent", true);
    const plane = Mesh.CreatePlane("TextPlane", size, scene, true);
    plane.material = new StandardMaterial("TextPlaneMaterial", scene);
    plane.material.backFaceCulling = false;
    plane.material.specularColor = new Color3(0, 0, 0);
    plane.material.diffuseTexture = dynamicTexture;
    return plane;
  };

  useEffect(() => {
    if (rootNode) {
      rootNode.scaling = new Vector3(scale, scale, scale);
    }
  }, [rootNode, scale]);

  const trackingStateToString = (trackingState: WebXRTrackingState | undefined) : string => {
    return trackingState === undefined ? '' : WebXRTrackingState[trackingState];
  };

  const onInitialized = useCallback(async(engineViewCallbacks: EngineViewCallbacks) => {
    setEngineViewCallbacks(engineViewCallbacks);
  }, [engine]);

  const onSnapshot = useCallback(async () => {
    if (engineViewCallbacks) {
      setSnapshotData('data:image/jpeg;base64,' + await engineViewCallbacks.takeSnapshot());
    }
  }, [engineViewCallbacks]);


  const createMat = (name: string,scene:Scene, diffuseColor: Color3,emissiveColor: Color3,specularColor: Color3)=>{
    const material = new StandardMaterial("green",scene);
    material.diffuseColor = diffuseColor;
    material.emissiveColor = emissiveColor;
    material.specularColor = specularColor;
    return material
  }

  const createPlane = (name: string,scene:Scene,material:Material, x:number,y:number,z:number)=>{
    const plane = MeshBuilder.CreatePlane(name,{size:3.6,updatable:true,sideOrientation:2});
    plane.position.x = x;
    plane.position.y = y;
    plane.position.z = z;
    plane.material = material;
    return plane;
  }

  return (
    <>
      <View style={props.style}>
        { !toggleView &&
          <View style={{flex: 1}}>
            { enableSnapshots &&
              <View style ={{flex: 1}}>
                <Button title={'Take Snapshot'} onPress={onSnapshot}/>
                <Image style={{flex: 1}} source={{uri: snapshotData }} />
              </View>
            }
            <EngineView camera={camera} onInitialized={onInitialized} displayFrameRate={true} antiAliasing={2}/>
            <Slider style={{position: 'absolute', minHeight: 50, margin: 10, left: 0, right: 0, bottom: 0}} minimumValue={0.2} maximumValue={2} step={0.01} value={defaultScale} onValueChange={setScale} />
            <Text style={{color: 'yellow',  position: 'absolute', margin: 3}}>{trackingStateToString(trackingState)}</Text>
          </View>
        }
        { toggleView &&
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{fontSize: 24}}>EngineView has been removed.</Text>
            <Text style={{fontSize: 12}}>Render loop stopped, but engine is still alive.</Text>
          </View>
        }
      </View>
    </>
  );
};

const App = () => {
  const [toggleScreen, setToggleScreen] = useState(false);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
        { !toggleScreen &&
          <EngineScreen style={{flex: 1}} />
        }
        { toggleScreen &&
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{fontSize: 24}}>EngineScreen has been removed.</Text>
            <Text style={{fontSize: 12}}>Engine has been disposed, and will be recreated.</Text>
          </View>
        }
        <Button title="Toggle EngineScreen" onPress={() => { setToggleScreen(!toggleScreen); }} />
      </SafeAreaView>
    </>
  );
};

export default App;
