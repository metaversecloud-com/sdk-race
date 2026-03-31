export const fireToast = jest.fn().mockResolvedValue({ success: true });
export const moveVisitor = jest.fn().mockResolvedValue({ success: true });
export const fetchDataObject = jest.fn().mockResolvedValue({});
export const setDataObject = jest.fn().mockResolvedValue({});
export const updateDataObject = jest.fn().mockResolvedValue({});
export const fetchInventoryItems = jest.fn().mockResolvedValue([]);
export const triggerActivity = jest.fn().mockResolvedValue({});
export const triggerParticle = jest.fn().mockResolvedValue({});

export enum WorldActivityType {
  GAME_ON = "GAME_ON",
  GAME_HIGH_SCORE = "GAME_HIGH_SCORE",
}

export class Topia {
  constructor(_opts: any) {}
}

export class AssetFactory {
  constructor(_topia: any) {}
}

export class DroppedAssetFactory {
  constructor(_topia: any) {}
  create(id: string, slug: string, opts: any) {
    return {
      deleteDroppedAsset: jest.fn().mockResolvedValue({}),
    };
  }
}

export class EcosystemFactory {
  constructor(_topia: any) {}
}

export class UserFactory {
  constructor(_topia: any) {}
}

export class VisitorFactory {
  constructor(_topia: any) {}
  create(visitorId: number, slug: string, opts: any) {
    return {
      fireToast,
      moveVisitor,
      fetchDataObject,
      setDataObject,
      updateDataObject,
      fetchInventoryItems,
      triggerParticle,
      dataObject: {},
      inventoryItems: [],
      isAdmin: false,
    };
  }
  get(visitorId: number, slug: string, opts: any) {
    return this.create(visitorId, slug, opts);
  }
}

export class WorldFactory {
  constructor(_topia: any) {}
  create(slug: string, opts: any) {
    return {
      fireToast,
      fetchDataObject,
      setDataObject,
      updateDataObject,
      triggerActivity,
      dataObject: {},
      fetchDroppedAssetsWithUniqueName: jest.fn().mockResolvedValue([]),
      fetchDroppedAssetsBySceneDropId: jest.fn().mockResolvedValue([]),
      dropScene: jest.fn().mockResolvedValue({}),
    };
  }
  static deleteDroppedAssets = jest.fn().mockResolvedValue({});
}

export const __mock = {
  fireToast,
  moveVisitor,
  fetchDataObject,
  setDataObject,
  updateDataObject,
  fetchInventoryItems,
  triggerActivity,
  triggerParticle,
  reset() {
    fireToast.mockClear();
    moveVisitor.mockClear();
    fetchDataObject.mockClear();
    setDataObject.mockClear();
    updateDataObject.mockClear();
    fetchInventoryItems.mockClear();
    triggerActivity.mockClear();
    triggerParticle.mockClear();
  },
};
