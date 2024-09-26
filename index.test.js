import _ from "lodash";
import { expect } from "chai";
function selectItems(itemSettingList) {
  let selectedItems = [];
  let trapAdded = false;
  let sizeCount = {};
  let itemCounts = {}; // Track how many of each item type/size have been added

  // Shuffle the array to randomize selection order
  let shuffledList = _.shuffle(itemSettingList);

  // Iterate through shuffled list and add items until selectedItems has 5 objects
  while (selectedItems.length < 5) {
    let item = _.sample(shuffledList); // Randomly pick an item
    const { type, size, rewardValueList, quantity } = item;

    // Track how many items of this type and size have been added
    let itemKey = `${type}_${size}`;

    // Check if we've already added more than the allowed quantity
    if (itemCounts[itemKey] >= quantity) {
      continue;
    }

    // Only add one TRAP type
    if (type === "TRAP" && trapAdded) {
      continue;
    }

    // Check if the size count is less than 2
    if (sizeCount[size] && sizeCount[size] >= 2) {
      continue;
    }

    // Randomly select one reward value from rewardValueList
    let rewardValue = _.sample(rewardValueList);

    // Add item to selectedItems
    selectedItems.push({
      type,
      size,
      rewardValue,
    });

    // Update the item count for this type/size
    itemCounts[itemKey] = (itemCounts[itemKey] || 0) + 1;

    // Track size count
    sizeCount[size] = (sizeCount[size] || 0) + 1;

    // Mark trap as added if it's a TRAP type
    if (type === "TRAP") {
      trapAdded = true;
    }
  }

  return selectedItems;
}
// Test cases
describe("selectItems function", () => {
  it("should select exactly 5 items", () => {
    const itemSettingList = [
      { type: "REWARD", size: 70, quantity: 2, rewardValueList: [50, 50] },
      { type: "BONUS", size: 60, quantity: 1, rewardValueList: [30] },
      { type: "TRAP", size: 50, quantity: 1, rewardValueList: [-20] },
      {
        type: "REWARD",
        size: 30,
        quantity: 5,
        rewardValueList: [10, 10, 10, 10, 10],
      },
      {
        type: "REWARD",
        size: 50,
        quantity: 3,
        rewardValueList: [25, 25, 25],
      },
    ];

    const selectedItems = selectItems(itemSettingList);

    // Check that 5 items are selected
    expect(selectedItems).to.have.lengthOf(5);
  });

  it("should not select more than 1 TRAP", () => {
    const itemSettingList = [
      { type: "REWARD", size: 70, quantity: 2, rewardValueList: [50, 50] },
      { type: "BONUS", size: 60, quantity: 1, rewardValueList: [30] },
      { type: "TRAP", size: 50, quantity: 1, rewardValueList: [-20] },
      { type: "TRAP", size: 30, quantity: 2, rewardValueList: [-10, -10] },
      {
        type: "REWARD",
        size: 30,
        quantity: 5,
        rewardValueList: [10, 10, 10, 10, 10],
      },
      {
        type: "REWARD",
        size: 50,
        quantity: 3,
        rewardValueList: [25, 25, 25],
      },
    ];

    const selectedItems = selectItems(itemSettingList);

    // Check that no more than 1 TRAP is selected
    const traps = selectedItems.filter((item) => item.type === "TRAP");
    expect(traps).to.have.lengthOf.at.most(1);
  });

  it("should not select more than 2 items of the same size", () => {
    const itemSettingList = [
      { type: "REWARD", size: 70, quantity: 2, rewardValueList: [50, 50] },
      { type: "BONUS", size: 60, quantity: 1, rewardValueList: [30] },
      { type: "TRAP", size: 50, quantity: 1, rewardValueList: [-20] },
      {
        type: "REWARD",
        size: 30,
        quantity: 5,
        rewardValueList: [10, 10, 10, 10, 10],
      },
      {
        type: "REWARD",
        size: 50,
        quantity: 3,
        rewardValueList: [25, 25, 25],
      },
    ];

    const selectedItems = selectItems(itemSettingList);

    // Check that no more than 2 items of the same size are selected
    const sizeCounts = selectedItems.reduce((acc, item) => {
      acc[item.size] = (acc[item.size] || 0) + 1;
      return acc;
    }, {});

    for (let size in sizeCounts) {
      expect(sizeCounts[size]).to.be.at.most(2);
    }
  });

  it("should not select more than the allowed quantity for any item", () => {
    const itemSettingList = [
      { type: "REWARD", size: 70, quantity: 2, rewardValueList: [50, 50] },
      { type: "BONUS", size: 60, quantity: 1, rewardValueList: [30] },
      { type: "TRAP", size: 50, quantity: 1, rewardValueList: [-20] },
      {
        type: "REWARD",
        size: 30,
        quantity: 5,
        rewardValueList: [10, 10, 10, 10, 10],
      },
      {
        type: "REWARD",
        size: 50,
        quantity: 3,
        rewardValueList: [25, 25, 25],
      },
    ];

    const selectedItems = selectItems(itemSettingList);

    // Check that no item is selected more times than its quantity
    const itemCounts = selectedItems.reduce((acc, item) => {
      let key = `${item.type}_${item.size}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    itemSettingList.forEach((item) => {
      let key = `${item.type}_${item.size}`;
      expect(itemCounts[key] || 0).to.be.at.most(item.quantity);
    });
  });
});
// The selectItems function from previous code
