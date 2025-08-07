// custom-palette/CustomPaletteProvider.js
import { assign } from 'min-dash'; // 辅助函数，用于对象合并

// 导入默认的 PaletteProvider
import DefaultPaletteProvider from 'bpmn-js/lib/features/palette/PaletteProvider';

export default function CustomPaletteProvider(
  palette,
  create,
  elementFactory,
  spaceTool,
  lassoTool,
  handTool,
  globalConnect,
  translate,
  injector // 注入 injector 以获取默认的 provider
) {
  // 调用默认 PaletteProvider 的构造函数
  DefaultPaletteProvider.call(this, palette, create, elementFactory, spaceTool, lassoTool, handTool, globalConnect, translate);

  // 保存对默认 getPaletteEntries 方法的引用
  this._defaultGetPaletteEntries = DefaultPaletteProvider.prototype.getPaletteEntries;
}

// 继承默认 PaletteProvider 的原型链
CustomPaletteProvider.$inject = DefaultPaletteProvider.$inject;
CustomPaletteProvider.prototype = Object.create(DefaultPaletteProvider.prototype);
CustomPaletteProvider.prototype.constructor = CustomPaletteProvider;

// 覆盖 getPaletteEntries 方法
CustomPaletteProvider.prototype.getPaletteEntries = function (element) {
  // 获取默认的调色板条目
  const entries = this._defaultGetPaletteEntries.call(this, element);

  // --- 这里执行简单的禁用操作：删除你不想要的条目 ---

  // 示例1：禁用 'Create Send Task'
  delete entries['create.send-task'];

  // 示例2：禁用 'Create Manual Task'
  delete entries['create.manual-task'];

  // 示例3：禁用 'Create Parallel Gateway'
  delete entries['create.parallel-gateway'];

  // 示例4：禁用所有子流程（展开和折叠）
  delete entries['create.subprocess-expanded'];
  delete entries['create.subprocess-collapsed']; // 如果有折叠的

  // 如果你只想保留某个特定分组（例如只保留事件和任务，删除所有网关）
  // Object.keys(entries).forEach(key => {
  //   if (entries[key].group === 'gateway') {
  //     delete entries[key];
  //   }
  // });

  return entries;
};