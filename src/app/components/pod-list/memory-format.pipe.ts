import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'memoryFormat',
  standalone: true
})
export class MemoryFormatPipe implements PipeTransform {
  transform(memory: string | undefined): string {
    if (!memory) return 'N/A';

    if (memory.endsWith('Ki')) {
      const ki = parseInt(memory.replace('Ki', ''), 10);
      return `${Math.round(ki / 1024)}Mi`; // convert Ki → Mi
    }

    return memory; // keep Mi, Gi, etc.
  }
}
