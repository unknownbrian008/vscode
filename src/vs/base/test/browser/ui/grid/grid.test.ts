/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { Direction, Grid, getRelativeLocation, Orientation, SerializableGrid, ISerializableView, IViewDeserializer, isGridBranchNode, GridNode } from 'vs/base/browser/ui/grid/grid';
import { TestView, nodesToArrays } from './util';

suite('Grid', function () {
	let container: HTMLElement;

	setup(function () {
		container = document.createElement('div');
		container.style.position = 'absolute';
		container.style.width = `${800}px`;
		container.style.height = `${600}px`;
	});

	teardown(function () {
		container = null;
	});

	test('getRelativeLocation', function () {
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [0], Direction.Up), [0]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [0], Direction.Down), [1]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [0], Direction.Left), [0, 0]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [0], Direction.Right), [0, 1]);

		assert.deepEqual(getRelativeLocation(Orientation.HORIZONTAL, [0], Direction.Up), [0, 0]);
		assert.deepEqual(getRelativeLocation(Orientation.HORIZONTAL, [0], Direction.Down), [0, 1]);
		assert.deepEqual(getRelativeLocation(Orientation.HORIZONTAL, [0], Direction.Left), [0]);
		assert.deepEqual(getRelativeLocation(Orientation.HORIZONTAL, [0], Direction.Right), [1]);

		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [4], Direction.Up), [4]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [4], Direction.Down), [5]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [4], Direction.Left), [4, 0]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [4], Direction.Right), [4, 1]);

		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [0, 0], Direction.Up), [0, 0, 0]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [0, 0], Direction.Down), [0, 0, 1]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [0, 0], Direction.Left), [0, 0]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [0, 0], Direction.Right), [0, 1]);

		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [1, 2], Direction.Up), [1, 2, 0]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [1, 2], Direction.Down), [1, 2, 1]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [1, 2], Direction.Left), [1, 2]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [1, 2], Direction.Right), [1, 3]);

		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [1, 2, 3], Direction.Up), [1, 2, 3]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [1, 2, 3], Direction.Down), [1, 2, 4]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [1, 2, 3], Direction.Left), [1, 2, 3, 0]);
		assert.deepEqual(getRelativeLocation(Orientation.VERTICAL, [1, 2, 3], Direction.Right), [1, 2, 3, 1]);
	});

	test('empty', function () {
		const view1 = new TestView(100, Number.MAX_VALUE, 100, Number.MAX_VALUE);
		const gridview = new Grid(container, view1);
		gridview.layout(800, 600);

		assert.deepEqual(view1.size, [800, 600]);
	});

	test('two views vertically', function () {
		const view1 = new TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		const grid = new Grid(container, view1);
		grid.layout(800, 600);
		assert.deepEqual(view1.size, [800, 600]);

		const view2 = new TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view2, 200, view1, Direction.Up);
		assert.deepEqual(view1.size, [800, 400]);
		assert.deepEqual(view2.size, [800, 200]);
	});

	test('two views horizontally', function () {
		const view1 = new TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		const grid = new Grid(container, view1);
		grid.layout(800, 600);
		assert.deepEqual(view1.size, [800, 600]);

		const view2 = new TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view2, 300, view1, Direction.Right);
		assert.deepEqual(view1.size, [500, 600]);
		assert.deepEqual(view2.size, [300, 600]);
	});

	test('simple layout', function () {
		const view1 = new TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		const grid = new Grid(container, view1);
		grid.layout(800, 600);
		assert.deepEqual(view1.size, [800, 600]);

		const view2 = new TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view2, 200, view1, Direction.Up);
		assert.deepEqual(view1.size, [800, 400]);
		assert.deepEqual(view2.size, [800, 200]);

		const view3 = new TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view3, 200, view1, Direction.Right);
		assert.deepEqual(view1.size, [600, 400]);
		assert.deepEqual(view2.size, [800, 200]);
		assert.deepEqual(view3.size, [200, 400]);

		const view4 = new TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view4, 200, view2, Direction.Left);
		assert.deepEqual(view1.size, [600, 400]);
		assert.deepEqual(view2.size, [600, 200]);
		assert.deepEqual(view3.size, [200, 400]);
		assert.deepEqual(view4.size, [200, 200]);

		const view5 = new TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view5, 100, view1, Direction.Down);
		assert.deepEqual(view1.size, [600, 300]);
		assert.deepEqual(view2.size, [600, 200]);
		assert.deepEqual(view3.size, [200, 400]);
		assert.deepEqual(view4.size, [200, 200]);
		assert.deepEqual(view5.size, [600, 100]);
	});
});

class TestSerializableView extends TestView implements ISerializableView {

	constructor(
		readonly name: string,
		minimumWidth: number,
		maximumWidth: number,
		minimumHeight: number,
		maximumHeight: number
	) {
		super(minimumWidth, maximumWidth, minimumHeight, maximumHeight);
	}

	toJSON() {
		return { name: this.name };
	}
}

class TestViewDeserializer implements IViewDeserializer<TestSerializableView> {

	fromJSON(json: any): TestSerializableView {
		return new TestSerializableView(json.name, 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
	}
}

function nodesToNames(node: GridNode<TestSerializableView>): any {
	if (isGridBranchNode(node)) {
		return node.children.map(nodesToNames);
	} else {
		return node.view.name;
	}
}

suite('SerializableGrid', function () {
	let container: HTMLElement;

	setup(function () {
		container = document.createElement('div');
		container.style.position = 'absolute';
		container.style.width = `${800}px`;
		container.style.height = `${600}px`;
	});

	teardown(function () {
		container = null;
	});

	test('serialize empty', function () {
		const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		const grid = new SerializableGrid(container, view1);

		assert.deepEqual(grid.serialize(), {
			orientation: 0,
			root: {
				type: 'branch',
				data: [
					{
						type: 'leaf',
						data: {
							name: 'view1'
						}
					}
				]
			}
		});
	});

	test('serialize simple layout', function () {
		const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		const grid = new SerializableGrid(container, view1);

		const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view2, 200, view1, Direction.Up);

		const view3 = new TestSerializableView('view3', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view3, 200, view1, Direction.Right);

		const view4 = new TestSerializableView('view4', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view4, 200, view2, Direction.Left);

		const view5 = new TestSerializableView('view5', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view5, 100, view1, Direction.Down);

		assert.deepEqual(grid.serialize(), {
			orientation: 0,
			root: {
				type: 'branch',
				data: [
					{
						type: 'branch',
						data: [
							{ type: 'leaf', data: { name: 'view4' } },
							{ type: 'leaf', data: { name: 'view2' } }
						]
					},
					{
						type: 'branch',
						data: [
							{
								type: 'branch',
								data: [
									{ type: 'leaf', data: { name: 'view1' } },
									{ type: 'leaf', data: { name: 'view5' } }
								]
							},
							{ type: 'leaf', data: { name: 'view3' } }
						]
					}
				]
			}
		});
	});

	test('deserialize empty', function () {
		const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		const grid = new SerializableGrid(container, view1);

		const json = grid.serialize();
		grid.dispose();

		const deserializer = new TestViewDeserializer();
		const grid2 = SerializableGrid.deserialize(container, json, deserializer);

		assert.deepEqual(nodesToNames(grid2.getViews()), ['view1']);
	});

	test('deserialize simple layout', function () {
		const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		const grid = new SerializableGrid(container, view1);

		const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view2, 200, view1, Direction.Up);

		const view3 = new TestSerializableView('view3', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view3, 200, view1, Direction.Right);

		const view4 = new TestSerializableView('view4', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view4, 200, view2, Direction.Left);

		const view5 = new TestSerializableView('view5', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
		grid.addView(view5, 100, view1, Direction.Down);

		const json = grid.serialize();
		grid.dispose();

		const deserializer = new TestViewDeserializer();
		const grid2 = SerializableGrid.deserialize(container, json, deserializer);

		assert.deepEqual(nodesToNames(grid2.getViews()), [['view4', 'view2'], [['view1', 'view5'], 'view3']]);
	});
});