import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cpuFormat',
  standalone: true
})
export class CpuFormatPipe implements PipeTransform {
  transform(cpu: string | undefined): string {
    if (!cpu) return 'N/A';

    if (cpu.endsWith('n')) {
      const n = parseInt(cpu.replace('n', ''), 10);
      return `${Math.round(n / 1000000)}m`; // nanocores → millicores
    }

    if (cpu.endsWith('m')) {
      return cpu; // already in millicores
    }

    return cpu; // assume it's already in cores
  }
}
