/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {assert} = require('chai');
const sinon = require('sinon');
const {
  assertSliderField,
  assertSliderFieldDefault,
} = require('./field_slider_test_helpers.mocha');
const {testHelpers} = require('@blockly/dev-tools');
const Blockly = require('blockly');
const {FieldSlider} = require('../src/index');

const {
  assertFieldValue,
  FieldCreationTestCase,
  FieldValueTestCase,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
  runTestCases,
} = testHelpers;

suite('FieldSlider', function () {
  /**
   * Configuration for field tests with invalid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    {title: 'Undefined', value: undefined},
    {title: 'Null', value: null},
    {title: 'NaN', value: NaN},
    {title: 'Non-Parsable String', value: 'bad'},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const validValueTestCases = [
    {title: 'Integer', value: 1, expectedValue: 1},
    {title: 'Float', value: 1.5, expectedValue: 1.5},
    {title: 'Integer String', value: '1', expectedValue: 1},
    {title: 'Float String', value: '1.5', expectedValue: 1.5},
    {title: 'Infinity', value: Infinity, expectedValue: Infinity},
    {title: 'Negative Infinity', value: -Infinity, expectedValue: -Infinity},
    {title: 'Infinity String', value: 'Infinity', expectedValue: Infinity},
    {
      title: 'Negative Infinity String',
      value: '-Infinity',
      expectedValue: -Infinity,
    },
  ];
  const addArgsAndJson = function (testCase) {
    testCase.args = Array(4).fill(testCase.value);
    testCase.json = {
      value: testCase.value,
      min: testCase.value,
      max: testCase.value,
      precision: testCase.value,
    };
  };
  invalidValueTestCases.forEach(addArgsAndJson);
  validValueTestCases.forEach(addArgsAndJson);

  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {FieldSlider} field The field to check.
   * @param {FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertSliderField(
      field,
      testCase.value,
      testCase.value,
      testCase.value,
      testCase.value,
    );
  };

  runConstructorSuiteTests(
    FieldSlider,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertSliderFieldDefault,
  );

  runFromJsonSuiteTests(
    FieldSlider,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertSliderFieldDefault,
  );

  suite('setValue', function () {
    suite('Empty -> New Value', function () {
      setup(function () {
        this.field = new FieldSlider();
      });
      runSetValueTests(validValueTestCases, invalidValueTestCases, 0);
    });
    suite('Value -> New Value', function () {
      setup(function () {
        this.field = new FieldSlider(1);
      });
      runSetValueTests(validValueTestCases, invalidValueTestCases, 1);
    });
    suite('Constraints', function () {
      const testCases = [
        {title: 'Float', json: {}, value: 123.456, expectedValue: 123.456},
        {
          title: '0.01',
          json: {precision: 0.01},
          value: 123.456,
          expectedValue: 123.46,
        },
        {
          title: '0.5',
          json: {precision: 0.5},
          value: 123.456,
          expectedValue: 123.5,
        },
        {title: '1', json: {precision: 1}, value: 123.456, expectedValue: 123},
        {
          title: '1.5',
          json: {precision: 1.5},
          value: 123.456,
          expectedValue: 123,
        },
      ];
      suite('Precision', function () {
        runTestCases(testCases, function (testCase) {
          return function () {
            const sliderField = FieldSlider.fromJson(testCase.json);
            sliderField.setValue(testCase.value);
            assertFieldValue(sliderField, testCase.expectedValue);
          };
        });
        test('Null', function () {
          const sliderField = FieldSlider.fromJson({precision: null});
          assert.equal(sliderField.getPrecision(), 0);
        });
      });
      const setValueBoundsTestFn = (testCase) => {
        return function () {
          const sliderField = FieldSlider.fromJson(testCase.json);
          testCase.values.forEach(function (value, i) {
            sliderField.setValue(value);
            assertFieldValue(sliderField, testCase.expectedValues[i]);
          });
        };
      };
      suite('Min', function () {
        const testCases = [
          {
            title: '-10',
            json: {min: -10},
            values: [-20, 0, 20],
            expectedValues: [-10, 0, 20],
          },
          {
            title: '0',
            json: {min: 0},
            values: [-20, 0, 20],
            expectedValues: [0, 0, 20],
          },
          {
            title: '+10',
            json: {min: 10},
            values: [-20, 0, 20],
            expectedValues: [10, 10, 20],
          },
        ];
        runTestCases(testCases, setValueBoundsTestFn);
        test('Null', function () {
          const sliderField = FieldSlider.fromJson({min: null});
          assert.equal(sliderField.getMin(), -Infinity);
        });
      });
      suite('Max', function () {
        const testCases = [
          {
            title: '-10',
            json: {max: -10},
            values: [-20, 0, 20],
            expectedValues: [-20, -10, -10],
          },
          {
            title: '0',
            json: {max: 0},
            values: [-20, 0, 20],
            expectedValues: [-20, 0, 0],
          },
          {
            title: '+10',
            json: {max: 10},
            values: [-20, 0, 20],
            expectedValues: [-20, 0, 10],
          },
        ];
        runTestCases(testCases, setValueBoundsTestFn);
        test('Null', function () {
          const sliderField = FieldSlider.fromJson({max: null});
          assert.equal(sliderField.getMax(), Infinity);
        });
      });
    });
  });

  suite('Validators', function () {
    setup(function () {
      this.sliderField = new FieldSlider(1);
      this.stub = sinon.stub(this.sliderField, 'resizeEditor_');
    });
    teardown(function () {
      sinon.restore();
    });
    const testSuites = [
      {
        title: 'Null Validator',
        validator: function () {
          return null;
        },
        value: 2,
        expectedValue: 1,
      },
      {
        title: 'Force End with 6 Validator',
        validator: function (newValue) {
          return String(newValue).replace(/.$/, '6');
        },
        value: 25,
        expectedValue: 26,
      },
      {
        title: 'Returns Undefined Validator',
        validator: function () {},
        value: 2,
        expectedValue: 2,
      },
    ];
    testSuites.forEach(function (suiteInfo) {
      suite(suiteInfo.title, function () {
        setup(function () {
          this.sliderField.setValidator(suiteInfo.validator);
        });
        test('When Not Editing', function () {
          this.sliderField.setValue(suiteInfo.value);
          assertFieldValue(this.sliderField, suiteInfo.expectedValue);
        });
      });
    });
  });

  suite('Customizations', function () {
    suite('Min', function () {
      test('JS Constructor', function () {
        const field = new FieldSlider(0, -10);
        assertSliderField(field, -10, Infinity, 0, 0);
      });
      test('JSON Definition', function () {
        const field = FieldSlider.fromJson({
          min: -10,
        });
        assertSliderField(field, -10, Infinity, 0, 0);
      });
      test('Set Constraints', function () {
        const field = new FieldSlider();
        field.setConstraints(-10);
        assertSliderField(field, -10, Infinity, 0, 0);
      });
      test('Set Min', function () {
        const field = new FieldSlider();
        field.setMin(-10);
        assertSliderField(field, -10, Infinity, 0, 0);
      });
      test('JS Configuration - Simple', function () {
        const field = new FieldSlider(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            min: -10,
          },
        );
        assertSliderField(field, -10, Infinity, 0, 0);
      });
      test('JS Configuration - Ignore', function () {
        const field = new FieldSlider(
          undefined,
          -1,
          undefined,
          undefined,
          undefined,
          {
            min: -10,
          },
        );
        assertSliderField(field, -10, Infinity, 0, 0);
      });
    });
    suite('Max', function () {
      test('JS Constructor', function () {
        const field = new FieldSlider(0, undefined, 10);
        assertSliderField(field, -Infinity, 10, 0, 0);
      });
      test('JSON Definition', function () {
        const field = FieldSlider.fromJson({
          max: 10,
        });
        assertSliderField(field, -Infinity, 10, 0, 0);
      });
      test('Set Constraints', function () {
        const field = new FieldSlider();
        field.setConstraints(undefined, 10);
        assertSliderField(field, -Infinity, 10, 0, 0);
      });
      test('Set Max', function () {
        const field = new FieldSlider();
        field.setMax(10);
        assertSliderField(field, -Infinity, 10, 0, 0);
      });
      test('JS Configuration - Simple', function () {
        const field = new FieldSlider(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            max: 10,
          },
        );
        assertSliderField(field, -Infinity, 10, 0, 0);
      });
      test('JS Configuration - Ignore', function () {
        const field = new FieldSlider(
          undefined,
          undefined,
          1,
          undefined,
          undefined,
          {
            max: 10,
          },
        );
        assertSliderField(field, -Infinity, 10, 0, 0);
      });
    });
    suite('Precision', function () {
      test('JS Constructor', function () {
        const field = new FieldSlider(0, undefined, undefined, 1);
        assertSliderField(field, -Infinity, Infinity, 1, 0);
      });
      test('JSON Definition', function () {
        const field = FieldSlider.fromJson({
          precision: 1,
        });
        assertSliderField(field, -Infinity, Infinity, 1, 0);
      });
      test('Set Constraints', function () {
        const field = new FieldSlider();
        field.setConstraints(undefined, undefined, 1);
        assertSliderField(field, -Infinity, Infinity, 1, 0);
      });
      test('Set Precision', function () {
        const field = new FieldSlider();
        field.setPrecision(1);
        assertSliderField(field, -Infinity, Infinity, 1, 0);
      });
      test('JS Configuration - Simple', function () {
        const field = new FieldSlider(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            precision: 1,
          },
        );
        assertSliderField(field, -Infinity, Infinity, 1, 0);
      });
      test('JS Configuration - Ignore', function () {
        const field = new FieldSlider(
          undefined,
          undefined,
          undefined,
          0.5,
          undefined,
          {
            precision: 1,
          },
        );
        assertSliderField(field, -Infinity, Infinity, 1, 0);
      });
    });
  });

  suite('Editor', function () {
    setup(function () {
      this.jsdomCleanup = require('jsdom-global')(
        '<!DOCTYPE html><div id="blocklyDiv"></div>',
      );
      global.SVGElement = window.SVGElement;
      // Blockly's focus handling constructs FocusEvent, which jsdom exposes on
      // window but not as a global.
      global.FocusEvent = window.FocusEvent;
      // jsdom doesn't provide requestAnimationFrame/cancelAnimationFrame, which
      // block rendering relies on. Route them through (faked) timers so they
      // exist and can be flushed deterministically in teardown.
      this.clock = sinon.useFakeTimers();
      window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
      window.cancelAnimationFrame = (id) => clearTimeout(id);
      this.workspace = Blockly.inject('blocklyDiv', {media: 'media/'});

      if (!Blockly.Blocks['slider_block']) {
        Blockly.defineBlocksWithJsonArray([
          {
            type: 'slider_block',
            message0: '%1',
            args0: [
              {
                type: 'field_slider',
                name: 'FIELD',
                value: 1,
                min: 0,
                max: 10,
                precision: 1,
              },
            ],
          },
        ]);
      }
      this.block = this.workspace.newBlock('slider_block');
      this.block.initSvg();
      this.block.render();
      this.field = this.block.getField('FIELD');

      // Open the editor so the test drives the real <input type="range"> and
      // the real text editor rather than stand-ins.
      this.field.showEditor_();
      this.slider =
        Blockly.DropDownDiv.getContentDiv().querySelector('input.fieldSlider');
      this.textInput = this.field.htmlInput_;
    });

    teardown(function () {
      Blockly.DropDownDiv.hideWithoutAnimation();
      Blockly.WidgetDiv.hide();
      this.workspace.dispose();
      this.clock.runAll();
      sinon.restore();
      this.jsdomCleanup();
    });

    /**
     * Simulate the user moving the slider knob to the given value.
     * @param {HTMLInputElement} slider The range input.
     * @param {string} value The value to drag to.
     */
    const dragSliderTo = function (slider, value) {
      slider.value = value;
      slider.dispatchEvent(new Event('input', {bubbles: true}));
    };

    /**
     * Simulate the user typing the given value into the text editor.
     * @param {HTMLInputElement} textInput The text editor input.
     * @param {string} value The value to type.
     */
    const typeIntoEditor = function (textInput, value) {
      textInput.value = value;
      textInput.dispatchEvent(new Event('input', {bubbles: true}));
      // The field updates the slider when the block rerenders, which is
      // queued for the next animation frame.
      Blockly.renderManagement.triggerQueuedRenders();
    };

    test('slider shows the initial value', function () {
      assert.equal(this.slider.value, '1');
    });

    test('moving the slider updates the field', function () {
      dragSliderTo(this.slider, '5');
      assertFieldValue(this.field, 5);
    });

    test('typing into the editor moves the slider', function () {
      typeIntoEditor(this.textInput, '7');
      assert.equal(this.slider.value, '7');
    });

    test('typing into the editor still moves the slider after a drag', function () {
      dragSliderTo(this.slider, '5');
      typeIntoEditor(this.textInput, '8');
      assert.equal(this.slider.value, '8');
    });
  });
});
