import {
  type BinarySensorDeviceAttributes,
  BinarySensorDeviceClass,
  type BridgeFeatureFlags,
} from "@home-assistant-matter-hub/common";
import type { EndpointType } from "@matter/main";
import {
  ContactSensorDevice,
  OccupancySensorDevice,
  OnOffSensorDevice,
  WaterLeakDetectorDevice,
} from "@matter/main/devices";
import { BasicInformationServer } from "../behaviors/basic-information-server.js";
import { BooleanStateServer } from "../behaviors/boolean-state-server.js";
import { IdentifyServer } from "../behaviors/identify-server.js";
import { OccupancySensingServer } from "../behaviors/occupancy-sensing-server.js";
import { OnOffSensorServer } from "../behaviors/on-off-sensor-server.js";
import { HomeAssistantEntityBehavior } from "../custom-behaviors/home-assistant-entity-behavior.js";

const OnOffSensorType = OnOffSensorDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  OnOffSensorServer,
);

const ContactSensorType = ContactSensorDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  BooleanStateServer.set({ config: { inverted: true } }),
);
const OccupancySensorType = OccupancySensorDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  OccupancySensingServer,
);
const WaterLeakDetectorType = WaterLeakDetectorDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  BooleanStateServer,
);

type CombinedType =
  | typeof ContactSensorType
  | typeof OccupancySensorType
  | typeof WaterLeakDetectorType
  | typeof OnOffSensorType;

const deviceClasses: Partial<Record<BinarySensorDeviceClass, CombinedType>> = {
  [BinarySensorDeviceClass.Occupancy]: OccupancySensorType,
  [BinarySensorDeviceClass.Motion]: OccupancySensorType,
  [BinarySensorDeviceClass.Moving]: OccupancySensorType,
  [BinarySensorDeviceClass.Presence]: OccupancySensorType,

  [BinarySensorDeviceClass.Door]: ContactSensorType,
  [BinarySensorDeviceClass.Window]: ContactSensorType,
  [BinarySensorDeviceClass.GarageDoor]: ContactSensorType,
  [BinarySensorDeviceClass.Lock]: ContactSensorType,

  [BinarySensorDeviceClass.Moisture]: WaterLeakDetectorType,
};

export function BinarySensorDevice(
  homeAssistantEntity: HomeAssistantEntityBehavior.State,
  featureFlags?: BridgeFeatureFlags,
): EndpointType {
  const defaultDeviceType =
    featureFlags?.useOnOffSensorAsDefaultForBinarySensors
      ? OnOffSensorType
      : ContactSensorType;

  const attributes = homeAssistantEntity.entity.state
    .attributes as BinarySensorDeviceAttributes;
  const deviceClass = attributes.device_class;
  const type =
    deviceClass && deviceClasses[deviceClass]
      ? deviceClasses[deviceClass]
      : defaultDeviceType;
  return type.set({ homeAssistantEntity });
}
